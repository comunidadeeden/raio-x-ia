import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const env = getSupabaseAdminEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
