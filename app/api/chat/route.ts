import { randomUUID } from "node:crypto";
import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getConfiguredModel } from "@/lib/ai/config";
import { buildModelHistory, extractTextFromUIMessage } from "@/lib/ai/messages";
import { RAIO_X_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { createConversationTitle } from "@/lib/ai/title";
import { requireApiAccess } from "@/lib/auth/access";
import { AppError, errorResponse } from "@/lib/errors";
import { getRateLimitEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { chatRequestSchema } from "@/lib/validation/chat";

export const maxDuration = 60;
const MAX_CHAT_REQUEST_BYTES = 50_000;

async function enforceRateLimit() {
  const env = getRateLimitEnv();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_chat_rate_limit", {
    request_limit: env.CHAT_RATE_LIMIT_REQUESTS,
    window_seconds: env.CHAT_RATE_LIMIT_WINDOW_SECONDS,
  });

  if (error) throw new AppError("Falha ao verificar limite.", "RATE_LIMIT_CHECK_FAILED", 500);
  if (!data) throw new AppError("Muitas solicitações. Aguarde um instante.", "RATE_LIMITED", 429, true);
}

export async function POST(request: Request) {
  try {
    const user = await requireApiAccess();
    await enforceRateLimit();

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_CHAT_REQUEST_BYTES) {
      throw new AppError("Mensagem muito grande.", "CHAT_REQUEST_TOO_LARGE", 413, true);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_CHAT_REQUEST_BYTES) {
      throw new AppError("Mensagem muito grande.", "CHAT_REQUEST_TOO_LARGE", 413, true);
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(rawBody);
    } catch (error) {
      logger.warn("chat_invalid_json", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      throw new AppError("Mensagem inválida.", "CHAT_INVALID_JSON", 400, true);
    }

    const parsed = chatRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      throw new AppError("Mensagem inválida.", "CHAT_INVALID_INPUT", 400, true);
    }

    const { id: conversationId, message } = parsed.data;
    const content = message.parts.map((part) => part.text).join("\n").trim();
    const admin = createAdminClient();

    const { data: existingConversation, error: conversationLookupError } = await admin
      .from("conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationLookupError) {
      throw new AppError("Falha ao localizar conversa.", "CONVERSATION_LOOKUP_FAILED", 500);
    }

    if (existingConversation && existingConversation.user_id !== user.id) {
      throw new AppError("Conversa não encontrada.", "CONVERSATION_NOT_FOUND", 404, true);
    }

    if (!existingConversation) {
      const { error } = await admin.from("conversations").insert({
        id: conversationId,
        user_id: user.id,
        title: createConversationTitle(content),
      });
      if (error) throw new AppError("Falha ao criar conversa.", "CONVERSATION_CREATE_FAILED", 500);
    }

    const { error: userMessageError } = await admin.from("messages").upsert(
      {
        conversation_id: conversationId,
        client_message_id: message.id,
        role: "user",
        content,
      },
      { onConflict: "conversation_id,client_message_id", ignoreDuplicates: true },
    );

    if (userMessageError) {
      throw new AppError("Falha ao salvar mensagem.", "USER_MESSAGE_SAVE_FAILED", 500);
    }

    const { data: storedMessages, error: historyError } = await admin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(60);

    if (historyError) throw new AppError("Falha ao carregar histórico.", "CHAT_HISTORY_FAILED", 500);

    const assistantMessageId = randomUUID();
    const result = streamText({
      model: getConfiguredModel(),
      system: RAIO_X_SYSTEM_PROMPT,
      messages: buildModelHistory([...storedMessages].reverse()),
    });

    const uiStream = toUIMessageStream({
      stream: result.stream,
      generateMessageId: () => assistantMessageId,
      onError: (error) => {
        logger.error("ai_stream_failed", error, { conversationId });
        return "Não foi possível concluir a resposta. Tente novamente.";
      },
      onEnd: async ({ responseMessage }) => {
        const assistantContent = extractTextFromUIMessage(responseMessage as UIMessage);
        if (!assistantContent) return;

        const { error: assistantSaveError } = await admin.from("messages").upsert(
          {
            id: assistantMessageId,
            conversation_id: conversationId,
            client_message_id: assistantMessageId,
            role: "assistant",
            content: assistantContent,
          },
          { onConflict: "conversation_id,client_message_id", ignoreDuplicates: true },
        );

        if (assistantSaveError) {
          logger.error("assistant_message_save_failed", assistantSaveError, { conversationId });
          throw new AppError("Falha ao salvar resposta.", "ASSISTANT_MESSAGE_SAVE_FAILED", 500);
        }

        const { error: touchError } = await admin
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId)
          .eq("user_id", user.id);

        if (touchError) logger.error("conversation_touch_failed", touchError, { conversationId });
      },
    });

    return createUIMessageStreamResponse({ stream: uiStream });
  } catch (error) {
    logger.error("chat_request_failed", error);
    return errorResponse(error);
  }
}
