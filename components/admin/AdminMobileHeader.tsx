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
  UserCircle, UsersRound, ClipboardList, ExternalLink,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/admin/dashboard", icone: LayoutDashboard, label: "Painel" },
  { href: "/admin/lancamentos", icone: TrendingUp, label: "Lançamentos" },
  { href: "/admin/pareceres", icone: FileText, label: "Pareceres" },
  { href: "/admin/importar", icone: FileSpreadsheet, label: "Importar" },
  { href: "/admin/avisos", icone: Bell, label: "Avisos" },
  { href: "/admin/obras", icone: HardHat, label: "Obras" },
  { href: "/admin/propostas", icone: MessageSquare, label: "Propostas" },
  { href: "/admin/enquetes", icone: BarChart2, label: "Enquetes" },
  { href: "/admin/planilhas", icone: FileDown, label: "Planilhas" },
  { href: "/admin/demandas", icone: ClipboardList, label: "Demandas" },
  { href: "/admin/membros", icone: UsersRound, label: "Quem Somos" },
];

interface Props {
  userName?: string | null;
  userRole?: string;
}

export default function AdminMobileHeader({ userName, userRole }: Props) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  function navClass(active: boolean) {
    return cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
      active
        ? "bg-[var(--primary-subtle)] text-primary"
        : "text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)]"
    );
  }

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAberto(true)}
            className="p-2 rounded-md text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors"
            style={{ minHeight: "auto" }}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm text-foreground">Admin RST</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle
            className="p-2 rounded-md text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors"
            style={{ minHeight: "auto" }}
          />
          <Link
            href="/admin/perfil"
            style={{ minHeight: "auto" }}
            className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-foreground transition-colors px-2 py-1.5 rounded hover:bg-[var(--surface-raised)]"
          >
            <UserCircle className="w-4 h-4" aria-hidden="true" />
            <span className="hidden xs:inline">{userName}</span>
          </Link>
        </div>
      </header>

      {/* Overlay */}
      {aberto && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-surface border-r border-border flex flex-col transition-transform duration-300",
        aberto ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight tracking-tight">Transparência RST</div>
              <div className="text-xs text-[var(--foreground-subtle)] leading-tight">Administração</div>
            </div>
          </div>
          <button
            onClick={() => setAberto(false)}
            style={{ minHeight: "auto" }}
            className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5" role="list">
            {links.map(({ href, icone: Icone, label }) => {
              const ativo = pathname === href || pathname?.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setAberto(false)}
                    style={{ minHeight: "auto" }}
                    className={navClass(ativo)}
                    aria-current={ativo ? "page" : undefined}
                  >
                    <Icone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
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
                  className={navClass(!!pathname?.startsWith("/admin/usuarios"))}
                >
                  <Users className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
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
                  className={navClass(pathname === "/admin/configuracoes")}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Configurações
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-0.5">
          <Link
            href="/admin/perfil"
            onClick={() => setAberto(false)}
            style={{ minHeight: "auto" }}
            className={navClass(pathname === "/admin/perfil")}
          >
            <UserCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Meu Perfil
          </Link>
          <Link
            href="/"
            target="_blank"
            style={{ minHeight: "auto" }}
            className={navClass(false)}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Portal público
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            style={{ minHeight: "auto" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] w-full transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
