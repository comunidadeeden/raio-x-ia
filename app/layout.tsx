import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Raio X IA",
    template: "%s | Raio X IA",
  },
  description: "Inteligência exclusiva para alunos da Mentoria Raio X.",
  applicationName: "Raio X IA",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
