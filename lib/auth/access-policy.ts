export type AccessDecision = "allow" | "login" | "access_unavailable";

export function getAccessDecision(
  hasSession: boolean,
  hasEntitlement: boolean,
): AccessDecision {
  if (!hasSession) return "login";
  if (!hasEntitlement) return "access_unavailable";
  return "allow";
}
