"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LogOut, Menu, MessageSquarePlus, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { deleteConversationAction, renameConversationAction } from "@/app/(app)/chat/actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import type { ConversationSummary } from "@/types/chat";

function ConversationRow({
  conversation,
  active,
  onNavigate,
}: {
  conversation: ConversationSummary;
  active: boolean;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [pending, startTransition] = useTransition();

  function saveTitle() {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    startTransition(async () => {
      const result = await renameConversationAction(conversation.id, nextTitle);
      if (result.ok) {
        setEditing(false);
        setMenuOpen(false);
        router.refresh();
      }
    });
  }

  function removeConversation() {
    if (!window.confirm("Excluir esta conversa? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await deleteConversationAction(conversation.id);
      if (result.ok) {
        setMenuOpen(false);
        if (active) router.replace("/chat");
        router.refresh();
      }
    });
  }

  return (
    <div className={`group relative rounded-lg ${active ? "bg-white shadow-[inset_2px_0_0_#0878d1]" : "hover:bg-white/70"}`}>
      {editing ? (
        <form
          className="flex items-center gap-1 p-1.5"
          onSubmit={(event) => { event.preventDefault(); saveTitle(); }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            autoFocus
            aria-label="Novo título da conversa"
            className="min-w-0 flex-1 rounded-md border border-[#91c8eb] bg-white px-2 py-1.5 text-sm outline-none"
          />
          <Button size="sm" type="submit" disabled={pending}>Salvar</Button>
        </form>
      ) : (
        <>
          <Link
            href={`/chat/${conversation.id}`}
            onClick={onNavigate}
            className="block truncate py-2.5 pl-3 pr-10 text-sm text-[#37413e]"
          >
            {conversation.title}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#6d7774] opacity-70 hover:bg-[#edf1f0] group-hover:opacity-100"
            aria-label={`Ações da conversa ${conversation.title}`}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </>
      )}

      {menuOpen && !editing && (
        <div className="absolute right-2 top-9 z-30 w-36 rounded-lg border border-[#dbe2df] bg-white p-1 shadow-lg">
          <button type="button" onClick={() => setEditing(true)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-[#f2f5f4]">
            <Pencil className="size-3.5" aria-hidden="true" /> Renomear
          </button>
          <button type="button" onClick={removeConversation} disabled={pending} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-[#a1271d] hover:bg-[#fff0ee]">
            <Trash2 className="size-3.5" aria-hidden="true" /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  conversations,
  activeConversationId,
  user,
  open,
  onOpenChange,
}: {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  user: { email: string; fullName: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 grid size-10 place-items-center rounded-lg border border-[#d9e0de] bg-white text-[#303a37] shadow-sm md:hidden"
        onClick={() => onOpenChange(true)}
        aria-label="Abrir conversas"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open && <button type="button" aria-label="Fechar menu" onClick={() => onOpenChange(false)} className="fixed inset-0 z-40 bg-black/25 md:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[18rem] flex-col border-r border-[#dce2e0] bg-[#f0f3f1] transition-transform md:static md:z-auto md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[4.6rem] items-center justify-between border-b border-[#dce2e0] px-4">
          <BrandMark />
          <button type="button" onClick={() => onOpenChange(false)} className="grid size-9 place-items-center rounded-md hover:bg-white md:hidden" aria-label="Fechar menu">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3">
          <Link href="/chat" onClick={() => onOpenChange(false)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.7rem] bg-[#0878d1] px-4 text-sm font-medium text-white transition hover:bg-[#0668b6]">
            <MessageSquarePlus className="size-4" aria-hidden="true" /> Nova conversa
          </Link>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" aria-label="Conversas anteriores">
          <p className="px-2 pb-2 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#78817f]">Conversas</p>
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm leading-6 text-[#7b8582]">Suas conversas aparecerão aqui.</p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeConversationId}
                  onNavigate={() => onOpenChange(false)}
                />
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-[#d7dedc] p-3 safe-bottom">
          <div className="mb-2 min-w-0 px-2">
            <p className="truncate text-sm font-medium text-[#26302d]">{user.fullName || "Aluno Raio X"}</p>
            <p className="truncate text-xs text-[#7b8582]">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#5d6865] hover:bg-white hover:text-[#222b29]">
              <LogOut className="size-4" aria-hidden="true" /> Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
