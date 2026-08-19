type LogContext = Record<string, string | number | boolean | null | undefined>;

function safeContext(context: LogContext): LogContext {
  const blocked = new Set(["content", "message", "payload", "email", "token", "secret"]);
  return Object.fromEntries(
    Object.entries(context).filter(([key]) => !blocked.has(key.toLowerCase())),
  );
}

export const logger = {
  error(event: string, error: unknown, context: LogContext = {}) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(JSON.stringify({ level: "error", event, errorName, ...safeContext(context) }));
  },
  warn(event: string, context: LogContext = {}) {
    console.warn(JSON.stringify({ level: "warn", event, ...safeContext(context) }));
  },
};
