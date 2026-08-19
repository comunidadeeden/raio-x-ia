import { notFound } from "next/navigation";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { requirePageAccess } from "@/lib/auth/access";
import { listConversations, loadConversation } from "@/lib/chat/queries";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageAccess();
  const [conversations, conversation] = await Promise.all([
    listConversations(user.id),
    loadConversation(id, user.id),
  ]);

  if (!conversation) notFound();

  return (
    <ChatWorkspace
      conversations={conversations}
      activeConversationId={id}
      initialMessages={conversation.messages}
      user={{ email: user.email, fullName: user.fullName }}
    />
  );
}
