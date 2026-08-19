"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";

export function Composer({
  input,
  onInputChange,
  onSubmit,
  onStop,
  busy,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
      className="relative rounded-2xl border border-[#ccd6d3] bg-white p-2 shadow-[0_12px_36px_rgba(26,49,43,0.10)] focus-within:border-[#79b8df] focus-within:ring-3 focus-within:ring-[#0878d1]/8"
    >
      <label htmlFor="chat-message" className="sr-only">Mensagem para a Raio X IA</label>
      <textarea
        ref={textareaRef}
        id="chat-message"
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        maxLength={12_000}
        placeholder="Pergunte o que você quer enxergar com mais clareza…"
        className="block max-h-[180px] min-h-12 w-full resize-none bg-transparent px-3 py-3 pr-14 text-[0.95rem] leading-6 text-[#17201e] outline-none placeholder:text-[#8a9491]"
      />
      {busy ? (
        <button type="button" onClick={onStop} className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-xl bg-[#17201e] text-white hover:bg-black" aria-label="Interromper resposta">
          <Square className="size-3.5 fill-current" aria-hidden="true" />
        </button>
      ) : (
        <button type="submit" disabled={!input.trim()} className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-xl bg-[#0878d1] text-white transition hover:bg-[#0668b6] disabled:cursor-not-allowed disabled:bg-[#c6d8e3]" aria-label="Enviar mensagem">
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
