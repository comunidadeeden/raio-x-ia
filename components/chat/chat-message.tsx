import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UIMessage } from "ai";

export function ChatMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  if (!text) return null;

  if (message.role === "user") {
    return (
      <article className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-[#eaf2f6] px-4 py-3 text-[0.95rem] leading-6 text-[#172320] sm:max-w-[76%]">
        <p className="whitespace-pre-wrap">{text}</p>
      </article>
    );
  }

  return (
    <article className="grid grid-cols-[1.7rem_minmax(0,1fr)] gap-3">
      <div className="mt-1 grid size-7 place-items-center rounded-full border border-[#abd3ec] bg-white text-[0.58rem] font-bold tracking-wide text-[#0878d1]" aria-hidden="true">RX</div>
      <div className="min-w-0">
        <p className="mb-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#0878d1]">Raio X</p>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
