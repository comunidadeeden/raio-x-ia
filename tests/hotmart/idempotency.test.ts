import { describe, expect, it } from "vitest";
import { decideExistingWebhook } from "@/lib/hotmart/idempotency";

describe("Hotmart webhook idempotency", () => {
  it.each(["processing", "processed", "ignored"] as const)(
    "acknowledges a duplicate in %s state without repeating effects",
    (status) => expect(decideExistingWebhook(status)).toBe("acknowledge"),
  );

  it("allows an explicitly failed event to be retried", () => {
    expect(decideExistingWebhook("failed")).toBe("retry");
  });

  it("recovers a processing event left stale by an interrupted execution", () => {
    expect(decideExistingWebhook("processing", {
      updatedAt: "2026-08-18T10:00:00.000Z",
      now: new Date("2026-08-18T10:06:00.000Z").getTime(),
    })).toBe("retry");
  });
});
