"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string; success?: string };

const emailSchema = z.email().transform((email) => email.trim().toLowerCase());
const passwordSchema = z.string().min(8).max(128);

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1).max(128) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });

  if (!parsed.success) return { error: "Preencha e-mail e senha corretamente." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-mail ou senha inválidos." };

  const { data: entitlement, error: entitlementError } = await supabase.rpc(
    "has_active_entitlement",
    { product_slug: "raio-x-ia" },
  );

  if (entitlementError) {
    logger.error("login_entitlement_check_failed", entitlementError);
    await supabase.auth.signOut();
    return { error: "Não foi possível verificar seu acesso. Tente novamente." };
  }

  redirect(entitlement ? "/chat" : "/acesso-indisponivel");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Informe um e-mail válido." };

  const supabase = await createClient();
  const appUrl = getAppEnv().NEXT_PUBLIC_APP_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha`,
  });

  if (error) logger.warn("password_reset_request_failed", { errorCode: error.code });
  return { success: "Se o e-mail estiver cadastrado, você receberá as instruções em instantes." };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({ password: passwordSchema, confirmation: passwordSchema })
    .refine((value) => value.password === value.confirmation, {
      message: "As senhas não coincidem.",
    })
    .safeParse({
      password: formData.get("password"),
      confirmation: formData.get("confirmation"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informe uma senha válida." };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) return { error: "Este link não é mais válido. Solicite um novo." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.warn("password_update_failed", { errorCode: error.code });
    return { error: "Não foi possível atualizar a senha. Solicite um novo link." };
  }

  redirect("/chat");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) logger.warn("logout_failed", { errorCode: error.code });
  redirect("/login");
}
