"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogIn, Menu, X } from "lucide-react";

const links = [
  { href: "/financeiro", label: "Receitas e Despesas" },
  { href: "/metricas", label: "Métricas" },
  { href: "/parecer", label: "Parecer" },
  { href: "/avisos", label: "Avisos" },
  { href: "/gestao", label: "Gestão" },
  { href: "/quem-somos", label: "Quem Somos" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-border">
      {/* Barra de identidade */}
      <div className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 min-h-[auto] group"
            aria-label="Página inicial — Transparência RST"
          >
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" aria-hidden="true">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight tracking-wide group-hover:text-white/90 transition-colors">
                Transparência RST
              </div>
              <div className="text-white/70 text-xs leading-tight hidden sm:block">
                Clareza nos números. Confiança na gestão.
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/login"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/10 min-h-[auto]"
              aria-label="Entrar na área administrativa"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              Entrar
            </Link>

            {/* Botão hamburger mobile */}
            <button
              className="sm:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors min-h-[auto]"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuAberto}
            >
              {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Barra de navegação — desktop */}
      <nav className="hidden sm:block bg-white" aria-label="Navegação principal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ul className="flex gap-0.5" role="list">
            {links.map((link) => {
              const ativo = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                      ativo
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                    aria-current={ativo ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Menu mobile expandido */}
      {menuAberto && (
        <nav className="sm:hidden bg-white border-t border-border" aria-label="Navegação mobile">
          <ul className="flex flex-col py-2" role="list">
            {links.map((link) => {
              const ativo = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuAberto(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium transition-colors",
                      ativo
                        ? "text-primary bg-primary/5 border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    aria-current={ativo ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="border-t border-border mt-2 pt-2">
              <Link
                href="/admin/login"
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Entrar na área administrativa
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
