import { describe, expect, it } from "vitest";
import { hotmartWebhookSchema } from "@/lib/hotmart/schema";
import { isConfiguredProduct, validateHotmartHottok } from "@/lib/hotmart/security";

const payload = hotmartWebhookSchema.parse({
  id: "evt_123",
  event: "PURCHASE_APPROVED",
  data: {
    product: { id: 12345, ucode: "product-ucode" },
    buyer: { email: "ALUNO@example.com" },
    purchase: { transaction: "HP123" },
  },
});

describe("Hotmart webhook security", () => {
  it("requires the exact HOTTOK", () => {
    expect(validateHotmartHottok("secret-token", "secret-token")).toBe(true);
    expect(validateHotmartHottok("wrong", "secret-token")).toBe(false);
    expect(validateHotmartHottok(null, "secret-token")).toBe(false);
  });

  it("requires every configured product identifier to match", () => {
    expect(isConfiguredProduct(payload, { productId: "12345", productUcode: "product-ucode" })).toBe(true);
    expect(isConfiguredProduct(payload, { productId: "999" })).toBe(false);
    expect(isConfiguredProduct(payload, { productUcode: "other" })).toBe(false);
    expect(isConfiguredProduct(payload, {})).toBe(false);
  });

  it("normalizes buyer e-mail and product id", () => {
    expect(payload.data.buyer?.email).toBe("aluno@example.com");
    expect(payload.data.product.id).toBe("12345");
  });
});
