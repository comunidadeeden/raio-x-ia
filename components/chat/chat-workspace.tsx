"use client";

import type { UIMessage } from "ai";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Sidebar } from "@/components/chat/sidebar";
import type { ConversationSummary } from "@/types/chat";

export function ChatWorkspace({
  conversations,
  activeConversationId,
  initialMessages,
  user,
}: {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  initialMessages: UIMessage[];
  user: { email: string; fullName: string | null };
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="flex h-dvh min-h-0 w-full overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        user={user}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      <ChatPanel conversationId={activeConversationId} initialMessages={initialMessages} />
    </main>
  );
}
