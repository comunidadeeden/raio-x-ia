import type { Metadata } from "next";
import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <section className="border border-[#dce2e0] bg-white p-7 shadow-[0_18px_50px_rgba(22,42,37,0.07)] sm:p-9">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">Recupere seu acesso</h1>
        <p className="mt-2 text-sm leading-6 text-[#68726f]">Enviaremos um link seguro para você definir uma nova senha.</p>
      </div>
      <AuthForm
        action={requestPasswordResetAction}
        fields={[{ name: "email", label: "E-mail", type: "email", autoComplete: "email" }]}
        submitLabel="Enviar instruções"
        secondaryHref="/login"
        secondaryLabel="Voltar para o login"
      />
    </section>
  );
}
