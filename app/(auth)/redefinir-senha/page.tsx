import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updatePasswordAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthenticatedUser } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Definir senha" };
export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  if (!(await getAuthenticatedUser())) redirect("/esqueci-senha");

  return (
    <section className="border border-[#dce2e0] bg-white p-7 shadow-[0_18px_50px_rgba(22,42,37,0.07)] sm:p-9">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">Defina sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-[#68726f]">Use no mínimo 8 caracteres e guarde a senha em local seguro.</p>
      </div>
      <AuthForm
        action={updatePasswordAction}
        fields={[
          { name: "password", label: "Nova senha", type: "password", autoComplete: "new-password" },
          { name: "confirmation", label: "Confirmar senha", type: "password", autoComplete: "new-password" },
        ]}
        submitLabel="Salvar senha"
      />
    </section>
  );
}
