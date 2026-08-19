import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

function isReadOnlyCookieContext(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Cookies can only be modified") ||
      error.message.includes("cookie store"))
  );
}

export async function createClient() {
  const env = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            if (!isReadOnlyCookieContext(error)) {
              throw error;
            }
          }
        },
      },
    },
  );
}
