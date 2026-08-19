import type { WebhookStatus } from "@/types/database";

export type ExistingWebhookDecision = "acknowledge" | "retry";

export function decideExistingWebhook(
  status: WebhookStatus,
  options?: { updatedAt?: string; now?: number; processingTimeoutMs?: number },
): ExistingWebhookDecision {
  if (status === "failed") return "retry";
  if (status !== "processing" || !options?.updatedAt) return "acknowledge";

  const updatedAt = new Date(options.updatedAt).getTime();
  const now = options.now ?? Date.now();
  const timeout = options.processingTimeoutMs ?? 5 * 60 * 1000;
  return Number.isFinite(updatedAt) && now - updatedAt >= timeout ? "retry" : "acknowledge";
}
