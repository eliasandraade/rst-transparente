import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
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
