import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

const supabasePublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,
});

const appSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
});

const supabaseAdminSchema = supabasePublicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,
});

const hotmartSchema = appSchema.extend({
  HOTMART_HOTTOK: nonEmpty,
  HOTMART_PRODUCT_ID: z.string().trim().optional(),
  HOTMART_PRODUCT_UCODE: z.string().trim().optional(),
  HOTMART_DELAYED_POLICY: z.enum(["keep_current", "suspend"]).default("keep_current"),
  HOTMART_CANCELED_POLICY: z.enum(["keep_current", "suspend", "revoke"]).default("keep_current"),
});

const aiSchema = z.object({
  AI_PROVIDER: nonEmpty,
  AI_MODEL: nonEmpty,
  AI_API_KEY: nonEmpty,
});

const rateLimitSchema = z.object({
  CHAT_RATE_LIMIT_REQUESTS: z.coerce.number().int().min(1).max(500).default(20),
  CHAT_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(10).max(3600).default(60),
});

function parseEnv<T>(schema: z.ZodType<T>, values: unknown, label: string): T {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuração ${label} inválida: ${details}`);
  }
  return parsed.data;
}

export function getSupabasePublicEnv() {
  return parseEnv(
    supabasePublicSchema,
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    "do Supabase público",
  );
}

export function getAppEnv() {
  return parseEnv(appSchema, { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL }, "da aplicação");
}

export function getSupabaseAdminEnv() {
  return parseEnv(
    supabaseAdminSchema,
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    "administrativa do Supabase",
  );
}

export function getHotmartEnv() {
  const env = parseEnv(
    hotmartSchema,
    {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      HOTMART_HOTTOK: process.env.HOTMART_HOTTOK,
      HOTMART_PRODUCT_ID: process.env.HOTMART_PRODUCT_ID,
      HOTMART_PRODUCT_UCODE: process.env.HOTMART_PRODUCT_UCODE,
      HOTMART_DELAYED_POLICY: process.env.HOTMART_DELAYED_POLICY,
      HOTMART_CANCELED_POLICY: process.env.HOTMART_CANCELED_POLICY,
    },
    "da Hotmart",
  );

  if (!env.HOTMART_PRODUCT_ID && !env.HOTMART_PRODUCT_UCODE) {
    throw new Error("Configure HOTMART_PRODUCT_ID ou HOTMART_PRODUCT_UCODE.");
  }
  return env;
}

export function getAIEnv() {
  return parseEnv(
    aiSchema,
    {
      AI_PROVIDER: process.env.AI_PROVIDER,
      AI_MODEL: process.env.AI_MODEL,
      AI_API_KEY: process.env.AI_API_KEY,
    },
    "da IA",
  );
}

export function getRateLimitEnv() {
  return parseEnv(
    rateLimitSchema,
    {
      CHAT_RATE_LIMIT_REQUESTS: process.env.CHAT_RATE_LIMIT_REQUESTS,
      CHAT_RATE_LIMIT_WINDOW_SECONDS: process.env.CHAT_RATE_LIMIT_WINDOW_SECONDS,
    },
    "de rate limit",
  );
}
