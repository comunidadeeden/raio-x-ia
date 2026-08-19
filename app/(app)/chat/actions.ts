"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiAccess } from "@/lib/auth/access";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type ConversationActionResult = { ok: boolean; error?: string };

const idSchema = z.uuid();
const titleSchema = z.string().trim().min(1).max(120);

export async function renameConversationAction(
  id: string,
  title: string,
): Promise<ConversationActionResult> {
  const parsed = z.object({ id: idSchema, title: titleSchema }).safeParse({ id, title });
  if (!parsed.success) return { ok: false, error: "Título inválido." };

  try {
    const user = await requireApiAccess();
    const supabase = await createClient();
    const { error } = await supabase
      .from("conversations")
      .update({ title: parsed.data.title })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/chat", "layout");
    return { ok: true };
  } catch (error) {
    logger.error("conversation_rename_failed", error, { conversationId: id });
    return { ok: false, error: "Não foi possível renomear a conversa." };
  }
}

export async function deleteConversationAction(id: string): Promise<ConversationActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Conversa inválida." };

  try {
    const user = await requireApiAccess();
    const supabase = await createClient();
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", parsed.data)
      .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/chat", "layout");
    return { ok: true };
  } catch (error) {
    logger.error("conversation_delete_failed", error, { conversationId: id });
    return { ok: false, error: "Não foi possível excluir a conversa." };
  }
}
