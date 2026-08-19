import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string | null;
};

async function resolveUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  const userId = data.claims.sub;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new AppError("Não foi possível carregar o perfil.", "PROFILE_LOOKUP_FAILED", 500);
  }

  return {
    id: userId,
    email: profile?.email ?? String(data.claims.email ?? ""),
    fullName: profile?.full_name ?? null,
  };
}

export const getAuthenticatedUser = resolveUser;

export async function hasActiveEntitlement(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_active_entitlement", {
    product_slug: "raio-x-ia",
  });

  if (error) {
    throw new AppError("Não foi possível verificar o acesso.", "ENTITLEMENT_CHECK_FAILED", 500);
  }

  return data === true;
}

export async function requirePageAccess(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  if (!(await hasActiveEntitlement())) redirect("/acesso-indisponivel");
  return user;
}

export async function requireApiAccess(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) throw new AppError("Autenticação necessária.", "UNAUTHENTICATED", 401, true);

  if (!(await hasActiveEntitlement())) {
    throw new AppError("Seu acesso não está ativo.", "ENTITLEMENT_INACTIVE", 403, true);
  }

  return user;
}
