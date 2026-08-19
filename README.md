# Raio X IA

Aplicação privada de inteligência artificial para alunos da Mentoria Raio X. O produto reúne autenticação por convite, controle de acesso sincronizado com a Hotmart, chat em streaming e histórico persistente.

## Stack

- Next.js 16 com App Router, React e TypeScript estrito
- Tailwind CSS
- Supabase Postgres, Auth, SSR e Row Level Security
- Vercel AI SDK e Vercel AI Gateway
- Resend como SMTP do Supabase Auth
- Vitest
- Vercel para hospedagem

## Desenvolvimento local

Pré-requisitos: Node.js 22.12 ou superior, npm e um projeto Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`. Sem as credenciais reais, as páginas que dependem de Supabase, Hotmart ou IA retornarão erro de configuração de forma segura.

Verificações disponíveis:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Variáveis de ambiente

| Variável | Escopo | Finalidade |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Público | URL canônica, incluindo protocolo. Em produção, use o domínio final. |
| `NEXT_PUBLIC_SUPABASE_URL` | Público | Project URL obtida no painel do Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Chave publishable ou `anon` do Supabase. Ela respeita RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | Chave secret/service role usada somente por webhooks e persistência privilegiada. |
| `HOTMART_HOTTOK` | Servidor | Token configurado no webhook Hotmart. |
| `HOTMART_PRODUCT_ID` | Servidor | ID numérico do produto Mentoria Raio X. |
| `HOTMART_PRODUCT_UCODE` | Servidor | Ucode do mesmo produto. Se os dois identificadores forem informados, ambos precisam coincidir. |
| `HOTMART_DELAYED_POLICY` | Servidor | `keep_current` (padrão) ou `suspend`. |
| `HOTMART_CANCELED_POLICY` | Servidor | `keep_current` (padrão), `suspend` ou `revoke`. |
| `RESEND_API_KEY` | Servidor/configuração | Chave usada como senha SMTP no Supabase Auth. |
| `EMAIL_FROM` | Servidor/configuração | Remetente verificado, por exemplo `Raio X <acesso@dominio.com>`. |
| `AI_PROVIDER` | Servidor | Prefixo do provider no AI Gateway, como `openai` ou `anthropic`. |
| `AI_MODEL` | Servidor | ID do modelo. Pode ser apenas o modelo ou o identificador completo `provider/model`. |
| `AI_API_KEY` | Servidor | Chave do Vercel AI Gateway. Nunca deve usar prefixo `NEXT_PUBLIC_`. |
| `CHAT_RATE_LIMIT_REQUESTS` | Servidor | Número máximo de requisições por janela. Padrão: 20. |
| `CHAT_RATE_LIMIT_WINDOW_SECONDS` | Servidor | Duração da janela persistente no Postgres. Padrão: 60 segundos. |

Nunca envie `.env.local` ao Git. O `.gitignore` bloqueia todos os arquivos `.env*`, exceto `.env.example`.

## Supabase

### Aplicar migrations

As alterações do banco estão em `supabase/migrations` e incluem tabelas, índices, constraints, triggers, funções, grants, RLS e policies.

Para validar localmente com Docker em execução:

```bash
npx supabase start
npx supabase db reset
npx supabase db lint --local --level warning --fail-on error
```

O `supabase/config.toml` já desativa cadastro público, exige senhas de pelo menos 8 caracteres e conecta os templates locais de convite e recuperação.

Para aplicar no projeto hospedado:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Depois da aplicação, execute os advisors de segurança e performance no painel ou pela CLI atual. Nenhuma mudança manual de schema é necessária.

O produto `raio-x-ia` é criado ou reconciliado pelo primeiro webhook válido, usando exclusivamente os identificadores configurados. Eventos de outro produto são ignorados.

### Auth

No painel do Supabase:

1. Desabilite cadastros públicos em **Authentication → Providers → Email**.
2. Defina a **Site URL** como o domínio de produção.
3. Adicione `https://SEU_DOMINIO/auth/callback` às Redirect URLs.
4. Em desenvolvimento, adicione `http://localhost:3000/auth/callback`.
5. Mantenha o tempo de expiração de OTP/invite compatível com sua operação.

A aplicação usa PKCE e cookies SSR. Páginas e APIs verificam o token com `getClaims`; o acesso ao chat também exige entitlement ativo no servidor.

## Resend

O envio de convite e recuperação é feito pelo Supabase Auth por SMTP. Configure em **Supabase → Authentication → SMTP Settings**:

- host: `smtp.resend.com`;
- porta: `465` ou `587`, conforme o modo escolhido;
- usuário: `resend`;
- senha: sua `RESEND_API_KEY`;
- remetente: o endereço verificado correspondente a `EMAIL_FROM`.

Verifique o domínio no Resend e publique os registros SPF e DKIM antes do lançamento. Copie o conteúdo de:

- `supabase/templates/invite.html` para o template **Invite user**;
- `supabase/templates/recovery.html` para o template **Reset password**.

Nenhuma senha é gerada ou enviada por e-mail. `inviteUserByEmail` cria o usuário e envia um link temporário para definição de senha.

## Hotmart

Cadastre um webhook 2.0.0 apontando para:

```text
https://DOMINIO/api/webhooks/hotmart
```

Habilite:

- `PURCHASE_APPROVED`
- `PURCHASE_COMPLETE`
- `PURCHASE_REFUNDED`
- `PURCHASE_CHARGEBACK`
- `PURCHASE_CANCELED`
- `PURCHASE_DELAYED`
- `SUBSCRIPTION_CANCELLATION`

Configure o mesmo token em Hotmart e `HOTMART_HOTTOK`. O endpoint compara `X-HOTMART-HOTTOK` em tempo constante, valida ID/ucode do produto e registra o ID único do evento antes de processar. Eventos processados, ignorados ou em processamento são reconhecidos sem repetir efeitos; eventos marcados como falhos podem ser reenviados.

Reembolso e chargeback revogam apenas o entitlement vinculado à transação ou assinatura recebida, protegendo compras posteriores. Regras ambíguas de atraso e cancelamento ficam centralizadas nas variáveis de política.

## IA

A configuração está isolada em:

- provider/modelo: `lib/ai/config.ts` e variáveis `AI_*`;
- system prompt: `lib/ai/system-prompt.ts`;
- sugestões do empty state: `lib/ai/suggestions.ts`;
- estratégia de título: `lib/ai/title.ts`.

O system prompt nunca é enviado ao navegador nem salvo na tabela de mensagens. Escolha um modelo disponível no catálogo atual do Vercel AI Gateway e configure a chave no ambiente da Vercel.

## Vercel

1. Envie o repositório ao GitHub.
2. Importe-o na Vercel como projeto Next.js.
3. Cadastre todas as variáveis de `.env.example` nos ambientes necessários.
4. Atualize `NEXT_PUBLIC_APP_URL`, Site URL e Redirect URLs para o domínio definitivo.
5. Execute o deploy e valide login, convite, recuperação, webhook e streaming.

O projeto não depende de filesystem persistente nem de estado em memória entre requisições. O rate limit e o histórico usam Postgres.

## Segurança e modelo de dados

- `profiles`: leitura do próprio registro; somente `full_name` pode ser atualizado pelo usuário.
- `conversations`: CRUD limitado ao proprietário por RLS.
- `messages`: somente leitura de mensagens pertencentes às próprias conversas; escrita ocorre server-side após autorização.
- `products`, `user_entitlements`, `webhook_events` e `chat_rate_limits`: sem acesso direto pelo cliente.
- funções privilegiadas verificam `auth.uid()` ou são concedidas exclusivamente a `service_role`.
- payloads e mensagens não são enviados aos logs de infraestrutura pela aplicação.

## Checklist de produção

- [ ] Aplicar a migration no Supabase e revisar os advisors.
- [ ] Desabilitar cadastro público.
- [ ] Configurar Site URL e Redirect URLs.
- [ ] Configurar SMTP Resend, domínio verificado e templates.
- [ ] Configurar HOTTOK, ID e ucode corretos do produto Hotmart.
- [ ] Confirmar as políticas comerciais de atraso, cancelamento e fim de assinatura.
- [ ] Definir provider, modelo, chave e system prompt definitivo.
- [ ] Substituir os placeholders de marca em `public/brand` e `app/icon.svg`.
- [ ] Configurar todas as variáveis na Vercel para Preview e Production.
- [ ] Rodar lint, typecheck, testes e build.
- [ ] Testar compra, convite, login, recuperação, refund, chargeback e reenvio do mesmo webhook em ambiente controlado.
- [ ] Validar orçamento e limites do provider de IA antes de liberar alunos.
