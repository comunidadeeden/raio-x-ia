import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, hasActiveEntitlement } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function AccessUnavailablePage() {
  if (!(await getAuthenticatedUser())) redirect("/login");
  if (await hasActiveEntitlement()) redirect("/chat");

  return (
    <section className="border border-[#dce2e0] bg-white p-8 text-center shadow-[0_18px_50px_rgba(22,42,37,0.07)] sm:p-10">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full border border-[#b9ddf2] bg-[#f2f9fe] text-2xl text-[#0878d1]" aria-hidden="true">×</div>
      <h1 className="text-2xl font-semibold tracking-[-0.035em]">Acesso indisponível</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#68726f]">Seu acesso à IA Raio X não está ativo no momento.</p>
      <form action={logoutAction} className="mt-7">
        <Button type="submit" variant="secondary">Sair</Button>
      </form>
    </section>
  );
}
