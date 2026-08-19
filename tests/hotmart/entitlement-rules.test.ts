import { describe, expect, it } from "vitest";
import { resolveEntitlementAction } from "@/lib/hotmart/entitlement-rules";

const policies = { delayed: "keep_current", canceled: "keep_current" } as const;

describe("Hotmart entitlement rules", () => {
  it.each(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"] as const)(
    "activates access for %s",
    (event) => {
      expect(resolveEntitlementAction(event, { expirationDate: null, policies })).toBe("activate");
    },
  );

  it("revokes access on refund", () => {
    expect(resolveEntitlementAction("PURCHASE_REFUNDED", { expirationDate: null, policies })).toBe("revoke");
  });

  it("revokes access immediately on chargeback", () => {
    expect(resolveEntitlementAction("PURCHASE_CHARGEBACK", { expirationDate: null, policies })).toBe("revoke");
  });

  it("keeps ambiguous cancellation rules configurable", () => {
    expect(resolveEntitlementAction("PURCHASE_DELAYED", { expirationDate: null, policies })).toBe("keep_current");
    expect(resolveEntitlementAction("PURCHASE_CANCELED", {
      expirationDate: null,
      policies: { delayed: "suspend", canceled: "suspend" },
    })).toBe("suspend");
  });

  it("schedules subscription expiry only when a date is present", () => {
    expect(resolveEntitlementAction("SUBSCRIPTION_CANCELLATION", {
      expirationDate: "2026-09-01T00:00:00.000Z",
      policies,
    })).toBe("schedule_expiration");
    expect(resolveEntitlementAction("SUBSCRIPTION_CANCELLATION", {
      expirationDate: null,
      policies,
    })).toBe("keep_current");
  });
});
