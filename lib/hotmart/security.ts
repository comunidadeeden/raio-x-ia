import { createHash, timingSafeEqual } from "node:crypto";
import type { HotmartWebhook } from "@/lib/hotmart/schema";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function validateHotmartHottok(provided: string | null, expected: string): boolean {
  if (!provided || !expected) return false;
  return timingSafeEqual(digest(provided.trim()), digest(expected.trim()));
}

export function isConfiguredProduct(
  event: HotmartWebhook,
  configured: { productId?: string; productUcode?: string },
): boolean {
  const expectedId = configured.productId?.trim();
  const expectedUcode = configured.productUcode?.trim();
  if (!expectedId && !expectedUcode) return false;

  if (expectedId && event.data.product.id !== expectedId) return false;
  if (expectedUcode && event.data.product.ucode !== expectedUcode) return false;
  return true;
}
