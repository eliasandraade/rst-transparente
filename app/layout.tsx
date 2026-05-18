import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Portal da Transparência — Condomínio Residencial Santíssima Trindade",
    template: "%s | Portal da Transparência",
  },
  description:
    "Acompanhe as finanças e prestações de contas do Condomínio Residencial Santíssima Trindade de forma clara e transparente.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
