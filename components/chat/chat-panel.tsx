"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { STARTER_SUGGESTIONS } from "@/lib/ai/suggestions";
import { ChatMessage } from "@/components/chat/chat-message";
import { Composer } from "@/components/chat/composer";

export function ChatPanel({
  conversationId,
  initialMessages,
}: {
  conversationId?: string;
  initialMessages: UIMessage[];
}) {
  const router = useRouter();
  const [draftId] = useState(() => crypto.randomUUID());
  const chatId = conversationId ?? draftId;
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            message: [...messages].reverse().find((message) => message.role === "user"),
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (!conversationId) router.replace(`/chat/${chatId}`, { scroll: false });
      router.refresh();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: status === "streaming" ? "smooth" : "auto" });
  }, [messages, status]);

  function submit(text = input) {
    const value = text.trim();
    if (!value || busy) return;
    void sendMessage({ text: value });
    setInput("");
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#fbfcfb]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="technical-grid absolute inset-x-0 top-0 h-60 opacity-35" />
      </div>

      <header className="relative z-10 flex h-[4.6rem] shrink-0 items-center border-b border-[#e1e6e4] bg-white/85 px-16 backdrop-blur-sm md:px-7">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#0878d1]">Leitura em andamento</p>
          <p className="mt-1 text-sm font-medium text-[#303a37]">Raio X IA</p>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
            <div className="relative mb-7 grid size-20 place-items-center rounded-full border border-[#b4d8ef] bg-white text-xl font-semibold text-[#0878d1] shadow-[0_0_0_10px_rgba(8,120,209,0.025)]" aria-hidden="true">
              X
              <span className="absolute inset-2 rounded-full border border-dashed border-[#0878d1]/20" />
            </div>
            <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#0878d1]">Ponto de análise</p>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#121816] sm:text-4xl">O que você quer enxergar com mais clareza hoje?</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#68726f]">Traga uma situação, decisão ou padrão que você deseja observar com mais precisão.</p>
            <div className="mt-9 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {STARTER_SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => submit(suggestion)} className="min-h-14 rounded-xl border border-[#d9e1de] bg-white px-4 py-3 text-left text-sm leading-5 text-[#44504c] transition hover:border-[#8fc3e4] hover:bg-[#f8fcfe]">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-9 px-5 py-10 sm:px-8">
            {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
            {status === "submitted" && (
              <div className="grid grid-cols-[1.7rem_minmax(0,1fr)] gap-3" role="status">
                <div className="grid size-7 place-items-center rounded-full border border-[#abd3ec] bg-white text-[0.58rem] font-bold text-[#0878d1]">RX</div>
                <div className="flex items-center gap-1 pt-2" aria-label="Raio X está analisando">
                  {[0, 1, 2].map((item) => <span key={item} className="size-1.5 animate-pulse rounded-full bg-[#78b8dd]" style={{ animationDelay: `${item * 160}ms` }} />)}
                </div>
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-xl border border-[#f0c9c5] bg-[#fff7f6] px-4 py-3 text-sm text-[#8d2b22]">
                <p>Não foi possível concluir a resposta.</p>
                <button type="button" onClick={() => void regenerate()} className="mt-2 inline-flex items-center gap-1.5 font-medium hover:underline">
                  <RotateCcw className="size-3.5" aria-hidden="true" /> Tentar novamente
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="relative z-20 shrink-0 bg-gradient-to-t from-[#fbfcfb] via-[#fbfcfb] to-transparent px-4 pb-4 pt-4 safe-bottom sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Composer input={input} onInputChange={setInput} onSubmit={() => submit()} onStop={() => void stop()} busy={busy} />
          <p className="mt-2 text-center text-[0.67rem] text-[#8a9491]">A IA pode cometer erros. Considere o contexto antes de tomar decisões importantes.</p>
        </div>
      </div>
    </div>
  );
}
