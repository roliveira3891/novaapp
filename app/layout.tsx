import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOVA — Network Operations and Visibility Automation",
  description: "Controle operacional de atividades em kanban",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
