import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ConversationSummary, StoredUIMessage } from "@/types/chat";

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw new AppError("Falha ao carregar conversas.", "CONVERSATIONS_LOAD_FAILED", 500);

  return data.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updated_at,
  }));
}

export async function loadConversation(
  conversationId: string,
  userId: string,
): Promise<{ title: string; messages: StoredUIMessage[] } | null> {
  const supabase = await createClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (conversationError) {
    throw new AppError("Falha ao carregar conversa.", "CONVERSATION_LOAD_FAILED", 500);
  }
  if (!conversation) return null;

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (messagesError) throw new AppError("Falha ao carregar mensagens.", "MESSAGES_LOAD_FAILED", 500);

  return {
    title: conversation.title,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      parts: [{ type: "text", text: message.content }],
    })),
  };
}
