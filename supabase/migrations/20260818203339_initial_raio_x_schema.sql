begin;

create type public.entitlement_status as enum ('active', 'suspended', 'revoked', 'expired');
create type public.webhook_event_status as enum ('processing', 'processed', 'failed', 'ignored');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(trim(email)) > 3),
  constraint profiles_full_name_length check (full_name is null or length(full_name) <= 160)
);

create unique index profiles_email_lower_unique on public.profiles (lower(email));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  hotmart_product_id text not null,
  hotmart_product_ucode text,
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_hotmart_id_not_blank check (length(trim(hotmart_product_id)) > 0),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index products_hotmart_product_id_unique
  on public.products (hotmart_product_id);
create unique index products_hotmart_product_ucode_unique
  on public.products (hotmart_product_ucode)
  where hotmart_product_ucode is not null;

create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  status public.entitlement_status not null default 'active',
  source text not null default 'hotmart',
  hotmart_transaction text,
  hotmart_subscriber_code text,
  started_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_entitlements_user_product_unique unique (user_id, product_id),
  constraint user_entitlements_source_not_blank check (length(trim(source)) > 0)
);

create index user_entitlements_user_id_idx on public.user_entitlements (user_id);
create index user_entitlements_product_id_idx on public.user_entitlements (product_id);
create index user_entitlements_status_expires_idx
  on public.user_entitlements (status, expires_at);
create unique index user_entitlements_product_transaction_unique
  on public.user_entitlements (product_id, hotmart_transaction)
  where hotmart_transaction is not null;
create index user_entitlements_subscriber_code_idx
  on public.user_entitlements (hotmart_subscriber_code)
  where hotmart_subscriber_code is not null;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_title_length check (length(trim(title)) between 1 and 120)
);

create index conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  client_message_id text,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_role_allowed check (role in ('user', 'assistant')),
  constraint messages_content_not_blank check (length(trim(content)) > 0),
  constraint messages_content_length check (length(content) <= 100000),
  constraint messages_client_id_length check (client_message_id is null or length(client_message_id) <= 200),
  constraint messages_conversation_client_id_unique unique (conversation_id, client_message_id)
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at, id);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  status public.webhook_event_status not null default 'processing',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  error_message text,
  constraint webhook_events_provider_event_unique unique (provider, external_event_id),
  constraint webhook_events_provider_not_blank check (length(trim(provider)) > 0),
  constraint webhook_events_external_id_not_blank check (length(trim(external_event_id)) > 0),
  constraint webhook_events_error_length check (error_message is null or length(error_message) <= 1000)
);

create index webhook_events_external_event_id_idx
  on public.webhook_events (external_event_id);
create index webhook_events_status_created_idx
  on public.webhook_events (status, created_at);

create table public.chat_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 0,
  constraint chat_rate_limits_count_nonnegative check (request_count >= 0)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger entitlements_set_updated_at
before update on public.user_entitlements
for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger webhook_events_set_updated_at
before update on public.webhook_events
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.has_active_entitlement(product_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    else exists (
      select 1
      from public.user_entitlements ue
      join public.products p on p.id = ue.product_id
      where ue.user_id = (select auth.uid())
        and p.slug = product_slug
        and p.active = true
        and ue.status = 'active'
        and (ue.expires_at is null or ue.expires_at > now())
    )
  end;
$$;

create or replace function public.consume_chat_rate_limit(
  request_limit integer,
  window_seconds integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_time timestamptz := clock_timestamp();
  allowed boolean;
begin
  if current_user_id is null then
    return false;
  end if;

  if request_limit < 1 or request_limit > 500 or window_seconds < 10 or window_seconds > 3600 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.chat_rate_limits as rate_limit (
    user_id,
    window_started_at,
    request_count
  )
  values (current_user_id, current_time, 1)
  on conflict (user_id) do update
  set
    window_started_at = case
      when rate_limit.window_started_at <= current_time - make_interval(secs => window_seconds)
        then current_time
      else rate_limit.window_started_at
    end,
    request_count = case
      when rate_limit.window_started_at <= current_time - make_interval(secs => window_seconds)
        then 1
      else rate_limit.request_count + 1
    end
  returning request_count <= request_limit into allowed;

  return allowed;
end;
$$;

create or replace function public.admin_find_auth_user_by_email(lookup_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(lookup_email))
  order by created_at asc
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.webhook_events enable row level security;
alter table public.chat_rate_limits enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "conversations_select_own"
on public.conversations for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "conversations_insert_own"
on public.conversations for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "conversations_update_own"
on public.conversations for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "conversations_delete_own"
on public.conversations for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "messages_select_from_own_conversations"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);

revoke all on public.profiles from anon, authenticated;
revoke all on public.products from anon, authenticated;
revoke all on public.user_entitlements from anon, authenticated;
revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;
revoke all on public.chat_rate_limits from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select on public.messages to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.has_active_entitlement(text) from public, anon;
grant execute on function public.has_active_entitlement(text) to authenticated;
revoke execute on function public.consume_chat_rate_limit(integer, integer) from public, anon;
grant execute on function public.consume_chat_rate_limit(integer, integer) to authenticated;
revoke execute on function public.admin_find_auth_user_by_email(text) from public, anon, authenticated;
grant execute on function public.admin_find_auth_user_by_email(text) to service_role;

commit;
