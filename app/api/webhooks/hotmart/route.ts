import { AppError, errorResponse } from "@/lib/errors";
import { getHotmartEnv } from "@/lib/env";
import { decideExistingWebhook } from "@/lib/hotmart/idempotency";
import { hotmartWebhookSchema, isSupportedHotmartEvent } from "@/lib/hotmart/schema";
import { isConfiguredProduct, validateHotmartHottok } from "@/lib/hotmart/security";
import { processEntitlementEvent } from "@/lib/hotmart/service";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

const MAX_WEBHOOK_BYTES = 1_000_000;

async function claimEvent(
  externalEventId: string,
  eventType: string,
  payload: Json,
): Promise<{ shouldProcess: boolean; eventId: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhook_events")
    .insert({
      provider: "hotmart",
      external_event_id: externalEventId,
      event_type: eventType,
      payload,
      status: "processing",
    })
    .select("id")
    .single();

  if (!error && data) return { shouldProcess: true, eventId: data.id };

  const { data: existing, error: lookupError } = await admin
    .from("webhook_events")
    .select("id, status, updated_at")
    .eq("provider", "hotmart")
    .eq("external_event_id", externalEventId)
    .single();

  if (lookupError || !existing) {
    throw new AppError("Falha ao registrar webhook.", "WEBHOOK_CLAIM_FAILED", 500);
  }

  if (decideExistingWebhook(existing.status, { updatedAt: existing.updated_at }) === "acknowledge") {
    return { shouldProcess: false, eventId: existing.id };
  }

  const { data: retried, error: retryError } = await admin
    .from("webhook_events")
    .update({ status: "processing", error_message: null })
    .eq("id", existing.id)
    .eq("status", existing.status)
    .eq("updated_at", existing.updated_at)
    .select("id")
    .maybeSingle();

  if (retryError) throw new AppError("Falha ao retomar webhook.", "WEBHOOK_RETRY_FAILED", 500);
  return { shouldProcess: retried !== null, eventId: existing.id };
}

async function finishEvent(eventId: string, status: "processed" | "ignored") {
  const admin = createAdminClient();
  const { error } = await admin
    .from("webhook_events")
    .update({ status, processed_at: new Date().toISOString(), error_message: null })
    .eq("id", eventId);
  if (error) throw new AppError("Falha ao finalizar webhook.", "WEBHOOK_FINISH_FAILED", 500);
}

async function failEvent(eventId: string, error: unknown) {
  const admin = createAdminClient();
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const { error: persistenceError } = await admin
    .from("webhook_events")
    .update({ status: "failed", error_message: `Processing failed: ${errorName}` })
    .eq("id", eventId);
  if (persistenceError) {
    logger.error("hotmart_webhook_failure_state_save_failed", persistenceError, { eventId });
  }
}

export async function POST(request: Request) {
  let claimedEventId: string | null = null;

  try {
    const env = getHotmartEnv();
    if (!validateHotmartHottok(request.headers.get("x-hotmart-hottok"), env.HOTMART_HOTTOK)) {
      throw new AppError("Webhook não autorizado.", "HOTMART_INVALID_HOTTOK", 401, true);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_WEBHOOK_BYTES) {
      throw new AppError("Payload muito grande.", "WEBHOOK_TOO_LARGE", 413, true);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
      throw new AppError("Payload muito grande.", "WEBHOOK_TOO_LARGE", 413, true);
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch (error) {
      logger.warn("hotmart_webhook_invalid_json", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      throw new AppError("JSON inválido.", "WEBHOOK_INVALID_JSON", 400, true);
    }

    const parsed = hotmartWebhookSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("Payload inválido.", "WEBHOOK_INVALID_PAYLOAD", 400, true);
    }

    const event = parsed.data;
    if (!isConfiguredProduct(event, {
      productId: env.HOTMART_PRODUCT_ID,
      productUcode: env.HOTMART_PRODUCT_UCODE,
    })) {
      return Response.json({ received: true, ignored: true });
    }

    const claim = await claimEvent(event.id, event.event, json as Json);
    claimedEventId = claim.eventId;
    if (!claim.shouldProcess) return Response.json({ received: true, duplicate: true });

    if (!isSupportedHotmartEvent(event.event)) {
      await finishEvent(claim.eventId, "ignored");
      return Response.json({ received: true, ignored: true });
    }

    await processEntitlementEvent(createAdminClient(), event, event.event);
    await finishEvent(claim.eventId, "processed");
    return Response.json({ received: true });
  } catch (error) {
    if (claimedEventId) await failEvent(claimedEventId, error);
    logger.error("hotmart_webhook_failed", error, { claimed: claimedEventId !== null });
    return errorResponse(error);
  }
}
