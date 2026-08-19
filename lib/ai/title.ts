export function createConversationTitle(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= 72) return normalized;
  return `${normalized.slice(0, 71).trimEnd()}…`;
}
