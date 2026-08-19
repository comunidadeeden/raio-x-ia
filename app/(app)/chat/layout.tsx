import { requirePageAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess();
  return children;
}
