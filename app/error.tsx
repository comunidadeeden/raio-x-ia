"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0878d1]">Interferência detectada</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Não foi possível carregar esta área.</h1>
        <p className="mt-3 text-sm text-[#68726f]">Tente novamente em instantes.</p>
        <Button className="mt-7" onClick={reset}>Tentar novamente</Button>
      </div>
    </main>
  );
}
