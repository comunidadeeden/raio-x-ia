import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0878d1]">Fora do enquadramento</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Esta conversa não foi encontrada.</h1>
        <Link href="/chat" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-[#0878d1] px-5 font-medium text-white">Voltar ao chat</Link>
      </div>
    </main>
  );
}
