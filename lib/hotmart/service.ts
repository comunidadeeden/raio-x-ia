import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { getHotmartEnv } from "@/lib/env";
import { resolveEntitlementAction } from "@/lib/hotmart/entitlement-rules";
import { parseHotmartDate, type HotmartWebhook, type SupportedHotmartEvent } from "@/lib/hotmart/schema";
import type { Database, EntitlementStatus } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

function getExpirationDate(event: HotmartWebhook): string | null {
  return (
    parseHotmartDate(event.data.subscription?.end_date) ??
    parseHotmartDate(event.data.subscription?.date_next_charge) ??
    parseHotmartDate(event.data.purchase?.warranty_expire_date)
  );
}

async function ensureProduct(admin: AdminClient, event: HotmartWebhook): Promise<string> {
  const product = {
    hotmart_product_id: event.data.product.id,
    hotmart_product_ucode: event.data.product.ucode ?? null,
    name: "Mentoria Raio X",
    slug: "raio-x-ia",
    active: true,
  };

  const { data, error } = await admin
    .from("products")
    .upsert(product, { onConflict: "hotmart_product_id" })
    .select("id")
    .single();

  if (error) {
    throw new AppError("Falha ao resolver produto Hotmart.", "HOTMART_PRODUCT_UPSERT_FAILED", 500);
  }

  return data.id;
}

async function findUserIdByEmail(admin: AdminClient, email: string): Promise<string | null> {
  const { data, error } = await admin.rpc("admin_find_auth_user_by_email", {
    lookup_email: email,
  });

  if (error) {
    throw new AppError("Falha ao localizar usuário.", "AUTH_USER_LOOKUP_FAILED", 500);
  }

  return data;
}

async function findOrInviteUser(
  admin: AdminClient,
  event: HotmartWebhook,
): Promise<{ userId: string; invited: boolean }> {
  const buyer = event.data.buyer;
  if (!buyer) {
    throw new AppError("Evento sem comprador.", "HOTMART_BUYER_MISSING", 400);
  }

  const existingUserId = await findUserIdByEmail(admin, buyer.email);
  if (existingUserId) return { userId: existingUserId, invited: false };

  const env = getHotmartEnv();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(buyer.email, {
    data: buyer.name ? { full_name: buyer.name } : undefined,
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/redefinir-senha`,
  });

  if (!error && data.user) {
    return { userId: data.user.id, invited: true };
  }

  const racedUserId = await findUserIdByEmail(admin, buyer.email);
  if (racedUserId) return { userId: racedUserId, invited: false };

  throw new AppError("Falha ao convidar usuário.", "AUTH_INVITE_FAILED", 500);
}

async function findTargetEntitlement(
  admin: AdminClient,
  event: HotmartWebhook,
  productId: string,
): Promise<string | null> {
  const transaction = event.data.purchase?.transaction;
  if (transaction) {
    const { data, error } = await admin
      .from("user_entitlements")
      .select("id")
      .eq("product_id", productId)
      .eq("hotmart_transaction", transaction)
      .maybeSingle();

    if (error) throw new AppError("Falha ao localizar acesso.", "ENTITLEMENT_LOOKUP_FAILED", 500);
    if (data) return data.id;
  }

  const subscriberCode = event.data.subscription?.subscriber?.code;
  if (subscriberCode) {
    const { data, error } = await admin
      .from("user_entitlements")
      .select("id")
      .eq("product_id", productId)
      .eq("hotmart_subscriber_code", subscriberCode)
      .maybeSingle();

    if (error) throw new AppError("Falha ao localizar acesso.", "ENTITLEMENT_LOOKUP_FAILED", 500);
    if (data) return data.id;
  }

  return null;
}

async function updateEntitlementStatus(
  admin: AdminClient,
  entitlementId: string,
  status: EntitlementStatus,
  expirationDate: string | null,
) {
  const { error } = await admin
    .from("user_entitlements")
    .update({
      status,
      expires_at: expirationDate,
      revoked_at: status === "revoked" ? new Date().toISOString() : null,
    })
    .eq("id", entitlementId);

  if (error) throw new AppError("Falha ao atualizar acesso.", "ENTITLEMENT_UPDATE_FAILED", 500);
}

export async function processEntitlementEvent(
  admin: AdminClient,
  event: HotmartWebhook,
  eventType: SupportedHotmartEvent,
): Promise<{ action: string; invited: boolean }> {
  const env = getHotmartEnv();
  const productId = await ensureProduct(admin, event);
  const expirationDate = getExpirationDate(event);
  const action = resolveEntitlementAction(eventType, {
    expirationDate,
    policies: {
      delayed: env.HOTMART_DELAYED_POLICY,
      canceled: env.HOTMART_CANCELED_POLICY,
    },
  });

  if (action === "activate") {
    const { userId, invited } = await findOrInviteUser(admin, event);
    const startedAt =
      parseHotmartDate(event.data.purchase?.approved_date) ??
      parseHotmartDate(event.data.purchase?.order_date) ??
      new Date().toISOString();

    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: userId,
        product_id: productId,
        status: "active",
        source: "hotmart",
        hotmart_transaction: event.data.purchase?.transaction ?? null,
        hotmart_subscriber_code: event.data.subscription?.subscriber?.code ?? null,
        started_at: startedAt,
        expires_at: null,
        revoked_at: null,
      },
      { onConflict: "user_id,product_id" },
    );

    if (error) {
      throw new AppError("Falha ao conceder acesso.", "ENTITLEMENT_UPSERT_FAILED", 500);
    }

    return { action, invited };
  }

  if (action === "keep_current") return { action, invited: false };

  const entitlementId = await findTargetEntitlement(admin, event, productId);
  if (!entitlementId) {
    return { action: "target_not_found", invited: false };
  }

  if (action === "schedule_expiration") {
    const { error } = await admin
      .from("user_entitlements")
      .update({ expires_at: expirationDate })
      .eq("id", entitlementId);
    if (error) throw new AppError("Falha ao agendar expiração.", "ENTITLEMENT_EXPIRY_FAILED", 500);
    return { action, invited: false };
  }

  await updateEntitlementStatus(
    admin,
    entitlementId,
    action === "revoke" ? "revoked" : "suspended",
    expirationDate,
  );

  return { action, invited: false };
}
