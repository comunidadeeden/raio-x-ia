import type { SupportedHotmartEvent } from "@/lib/hotmart/schema";

export type EntitlementAction =
  | "activate"
  | "revoke"
  | "suspend"
  | "schedule_expiration"
  | "keep_current";

export type CommercialPolicies = {
  delayed: "keep_current" | "suspend";
  canceled: "keep_current" | "suspend" | "revoke";
};

export function resolveEntitlementAction(
  event: SupportedHotmartEvent,
  options: { expirationDate: string | null; policies: CommercialPolicies },
): EntitlementAction {
  switch (event) {
    case "PURCHASE_APPROVED":
    case "PURCHASE_COMPLETE":
      return "activate";
    case "PURCHASE_REFUNDED":
    case "PURCHASE_CHARGEBACK":
      return "revoke";
    case "PURCHASE_DELAYED":
      return options.policies.delayed;
    case "PURCHASE_CANCELED":
      return options.policies.canceled;
    case "SUBSCRIPTION_CANCELLATION":
      return options.expirationDate ? "schedule_expiration" : "keep_current";
  }
}
