import { describe, expect, it } from "vitest";
import { createConversationTitle } from "@/lib/ai/title";

describe("conversation title", () => {
  it("normalizes whitespace without a second AI call", () => {
    expect(createConversationTitle("  Quero   entender\nesta situação  ")).toBe("Quero entender esta situação");
  });

  it("limits long titles", () => {
    expect(createConversationTitle("a".repeat(100))).toHaveLength(72);
    expect(createConversationTitle("a".repeat(100))).toMatch(/…$/);
  });
});
