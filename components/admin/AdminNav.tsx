"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  LogOut,
  Building2,
  Settings,
  Users,
  FileSpreadsheet,
  Bell,
  HardHat,
  MessageSquare,
  BarChart2,
  FileDown,
  UserCircle,
  UsersRound,
  ClipboardList,
  ExternalLink,
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
  { href: "/admin/demandas", icone: ClipboardList, label: "Demandas" },
  { href: "/admin/enquetes", icone: BarChart2, label: "Enquetes" },
  { href: "/admin/planilhas", icone: FileDown, label: "Planilhas" },
  { href: "/admin/demandas", icone: ClipboardList, label: "Demandas" },
  { href: "/admin/membros", icone: UsersRound, label: "Quem Somos" },
];

interface AdminNavProps {
  userRole?: string;
}

export default function AdminNav({ userRole }: AdminNavProps) {
  const pathname = usePathname();

  function navClass(active: boolean) {
    return cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
      active
        ? "bg-[var(--primary-subtle)] text-primary"
        : "text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)]"
    );
  }

  return (
    <aside className="w-60 min-h-screen bg-surface border-r border-border flex flex-col">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-tight tracking-tight">
              Transparência RST
            </div>
            <div className="text-xs text-[var(--foreground-subtle)] leading-tight">
              Administração
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Navegação administrativa">
        <ul className="space-y-0.5" role="list">
          {links.map(({ href, icone: Icone, label }) => {
            const ativo = pathname === href || pathname?.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
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
                className={navClass(pathname === "/admin/configuracoes")}
              >
                <Settings className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Configurações
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-[var(--foreground-subtle)]">Aparência</span>
          <ThemeToggle
            className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors"
            style={{ minHeight: "auto" }}
          />
        </div>
        <Link
          href="/admin/perfil"
          className={navClass(pathname === "/admin/perfil")}
        >
          <UserCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Meu Perfil
        </Link>
        <Link
          href="/"
          target="_blank"
          className={navClass(false)}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Portal público
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors duration-150"
          style={{ minHeight: "auto" }}
          aria-label="Sair da área administrativa"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  );
}
