import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthenticatedUser, hasActiveEntitlement } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) redirect((await hasActiveEntitlement()) ? "/chat" : "/acesso-indisponivel");

  return (
    <section className="border border-[#dce2e0] bg-white p-7 shadow-[0_18px_50px_rgba(22,42,37,0.07)] sm:p-9">
      <div className="mb-7">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#0878d1]">Acesso exclusivo</p>
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">Entre na sua área</h1>
        <p className="mt-2 text-sm leading-6 text-[#68726f]">Use o e-mail cadastrado na Mentoria Raio X.</p>
      </div>
      <AuthForm
        action={loginAction}
        fields={[
          { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
          { name: "password", label: "Senha", type: "password", autoComplete: "current-password" },
        ]}
        submitLabel="Entrar"
        secondaryHref="/esqueci-senha"
        secondaryLabel="Esqueci minha senha"
      />
    </section>
  );
}
