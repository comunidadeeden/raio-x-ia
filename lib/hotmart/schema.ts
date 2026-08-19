import { z } from "zod";

export const supportedHotmartEvents = [
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_DELAYED",
  "SUBSCRIPTION_CANCELLATION",
] as const;

const stringIdentifier = z.union([z.string(), z.number()]).transform(String);
const optionalDate = z.union([z.string(), z.number()]).nullish();

export const hotmartWebhookSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    event: z.string().trim().min(1).max(100),
    version: z.string().optional(),
    creation_date: optionalDate,
    data: z
      .object({
        product: z
          .object({
            id: stringIdentifier,
            ucode: stringIdentifier.nullish(),
            name: z.string().trim().max(300).optional(),
          })
          .passthrough(),
        buyer: z
          .object({
            email: z.email().transform((email) => email.trim().toLowerCase()),
            name: z.string().trim().max(160).optional(),
          })
          .passthrough()
          .optional(),
        purchase: z
          .object({
            transaction: z.string().trim().min(1).max(200).optional(),
            approved_date: optionalDate,
            order_date: optionalDate,
            warranty_expire_date: optionalDate,
          })
          .passthrough()
          .optional(),
        subscription: z
          .object({
            subscriber: z
              .object({
                code: z.string().trim().min(1).max(200).optional(),
              })
              .passthrough()
              .optional(),
            date_next_charge: optionalDate,
            end_date: optionalDate,
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type HotmartWebhook = z.infer<typeof hotmartWebhookSchema>;
export type SupportedHotmartEvent = (typeof supportedHotmartEvents)[number];

export function isSupportedHotmartEvent(event: string): event is SupportedHotmartEvent {
  return supportedHotmartEvents.includes(event as SupportedHotmartEvent);
}

export function parseHotmartDate(value: string | number | null | undefined): string | null {
  if (value == null) return null;

  const numeric = typeof value === "number" ? value : Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
