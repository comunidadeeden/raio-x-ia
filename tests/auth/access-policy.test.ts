import { describe, expect, it } from "vitest";
import { getAccessDecision } from "@/lib/auth/access-policy";

describe("protected route access policy", () => {
  it("redirects anonymous visitors to login", () => {
    expect(getAccessDecision(false, false)).toBe("login");
  });

  it("blocks authenticated users without entitlement", () => {
    expect(getAccessDecision(true, false)).toBe("access_unavailable");
  });

  it("allows only authenticated users with active entitlement", () => {
    expect(getAccessDecision(true, true)).toBe("allow");
  });
});
