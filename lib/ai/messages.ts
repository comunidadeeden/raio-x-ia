import type { ModelMessage, UIMessage } from "ai";

export function extractTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function buildModelHistory(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxCharacters = 60_000,
): ModelMessage[] {
  const selected: typeof messages = [];
  let characters = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    if (selected.length > 0 && characters + message.content.length > maxCharacters) break;
    selected.push(message);
    characters += message.content.length;
  }

  return selected.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
}
