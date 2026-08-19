import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const allowedDestinations = new Set(["/redefinir-senha", "/chat"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedDestination = url.searchParams.get("next") ?? "/chat";
  const destination = allowedDestinations.has(requestedDestination)
    ? requestedDestination
    : "/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, url.origin));
    logger.warn("auth_code_exchange_failed", { errorCode: error.code });
  }

  return NextResponse.redirect(new URL("/login?erro=link-invalido", url.origin));
}
