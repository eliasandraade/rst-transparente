import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { headers } from "next/headers";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Orken COND",
    template: "%s | Orken COND",
  },
  description:
    "Gestão, transparência e relacionamento condominial: finanças, demandas, avisos, enquetes e jurídico de cada condomínio em um só lugar.",
  robots: {
    index: true,
    follow: true,
  },
  other: {
    generator: "Andrade Systems",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonce da CSP desta requisição (middleware): o script do tema precisa dele.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider nonce={nonce}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
