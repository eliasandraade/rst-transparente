"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, LogIn } from "lucide-react";

const links = [
  { href: "/financeiro", label: "Receitas e Despesas" },
  { href: "/metricas", label: "Métricas" },
  { href: "/parecer", label: "Parecer do Conselho" },
  { href: "/avisos", label: "Avisos" },
  { href: "/gestao", label: "Gestão" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Logo + Nome */}
        <div className="flex items-center justify-between py-4 border-b border-border/50">
          <Link
            href="/"
            className="flex items-center gap-3 min-h-[auto] group"
            aria-label="Página inicial do Portal da Transparência"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-foreground leading-tight text-base group-hover:text-primary transition-colors">
                Portal da Transparência
              </div>
              <div className="text-muted-foreground text-xs leading-tight">
                Condomínio Residencial Santíssima Trindade
              </div>
            </div>
          </Link>

          <Link
            href="/admin/login"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-muted min-h-[44px]"
            aria-label="Entrar na área administrativa"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        </div>

        {/* Navegação principal */}
        <nav aria-label="Navegação principal">
          <ul className="flex gap-1 py-1" role="list">
            {links.map((link) => {
              const ativo = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                      "min-h-[44px]",
                      ativo
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    aria-current={ativo ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
