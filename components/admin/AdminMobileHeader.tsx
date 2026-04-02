"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Menu, X, LogOut, Building2, Settings, Users,
  LayoutDashboard, TrendingUp, FileText, FileSpreadsheet,
  Bell, HardHat, MessageSquare, BarChart2, FileDown,
  UserCircle, UsersRound,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/admin/dashboard", icone: LayoutDashboard, label: "Painel" },
  { href: "/admin/lancamentos", icone: TrendingUp, label: "Lançamentos" },
  { href: "/admin/pareceres", icone: FileText, label: "Pareceres" },
  { href: "/admin/importar", icone: FileSpreadsheet, label: "Importar Planilha" },
  { href: "/admin/avisos", icone: Bell, label: "Avisos" },
  { href: "/admin/obras", icone: HardHat, label: "Obras" },
  { href: "/admin/propostas", icone: MessageSquare, label: "Propostas" },
  { href: "/admin/enquetes", icone: BarChart2, label: "Enquetes" },
  { href: "/admin/planilhas", icone: FileDown, label: "Planilhas" },
  { href: "/admin/membros", icone: UsersRound, label: "Quem Somos" },
];

interface Props {
  userName?: string | null;
  userRole?: string;
}

export default function AdminMobileHeader({ userName, userRole }: Props) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAberto(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            style={{ minHeight: "auto" }}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Transparência RST</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" style={{ minHeight: "auto" }} />
          <Link
            href="/admin/perfil"
            style={{ minHeight: "auto" }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded hover:bg-muted"
          >
            <UserCircle className="w-4 h-4" />
            <span className="hidden xs:inline">{userName}</span>
          </Link>
        </div>
      </header>

      {/* Overlay */}
      {aberto && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-900 border-r border-border flex flex-col transition-transform duration-300",
        aberto ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header do drawer */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Transparência RST</div>
              <div className="text-xs text-muted-foreground leading-tight">Área Administrativa</div>
            </div>
          </div>
          <button
            onClick={() => setAberto(false)}
            style={{ minHeight: "auto" }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5" role="list">
            {links.map(({ href, icone: Icone, label }) => {
              const ativo = pathname === href || pathname?.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setAberto(false)}
                    style={{ minHeight: "auto" }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      ativo
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    aria-current={ativo ? "page" : undefined}
                  >
                    <Icone className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}

            {(userRole === "MASTER" || userRole === "SINDICO") && (
              <li>
                <Link
                  href="/admin/usuarios"
                  onClick={() => setAberto(false)}
                  style={{ minHeight: "auto" }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    pathname?.startsWith("/admin/usuarios")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  Usuários
                </Link>
              </li>
            )}

            {userRole === "MASTER" && (
              <li>
                <Link
                  href="/admin/configuracoes"
                  onClick={() => setAberto(false)}
                  style={{ minHeight: "auto" }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    pathname === "/admin/configuracoes"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  Configurações
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Rodapé do drawer */}
        <div className="p-3 border-t border-border space-y-0.5">
          <Link
            href="/admin/perfil"
            onClick={() => setAberto(false)}
            style={{ minHeight: "auto" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <UserCircle className="w-4 h-4" />
            Meu Perfil
          </Link>
          <Link
            href="/"
            style={{ minHeight: "auto" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Ver portal público
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            style={{ minHeight: "auto" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-danger hover:bg-muted w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
