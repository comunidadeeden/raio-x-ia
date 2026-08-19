import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { requirePageAccess } from "@/lib/auth/access";
import { listConversations } from "@/lib/chat/queries";

export default async function NewChatPage() {
  const user = await requirePageAccess();
  const conversations = await listConversations(user.id);

  return (
    <ChatWorkspace
      conversations={conversations}
      initialMessages={[]}
      user={{ email: user.email, fullName: user.fullName }}
    />
  );
}
