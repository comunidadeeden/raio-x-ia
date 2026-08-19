import type { UIMessage } from "ai";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type StoredUIMessage = UIMessage;
