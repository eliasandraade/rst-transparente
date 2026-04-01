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
} from "lucide-react";

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

interface AdminNavProps {
  userRole?: string;
}

export default function AdminNav({ userRole }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-tight">
              Transparência RST
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              Área Administrativa
            </div>
          </div>
        </div>
      </div>

      {/* Links de navegação */}
      <nav className="flex-1 p-4" aria-label="Navegação administrativa">
        <ul className="space-y-1" role="list">
          {links.map(({ href, icone: Icone, label }) => {
            const ativo =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    ativo
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
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
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname?.startsWith("/admin/usuarios")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
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
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === "/admin/configuracoes"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Settings className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Configurações
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Perfil + Logout */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/admin/perfil"
          className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted transition-colors",
            pathname === "/admin/perfil" ? "bg-primary/10 text-primary" : ""
          )}
        >
          <UserCircle className="w-4 h-4" aria-hidden="true" />
          Meu Perfil
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted transition-colors"
        >
          <Building2 className="w-4 h-4" aria-hidden="true" />
          Ver portal público
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-danger px-3 py-2 rounded-md hover:bg-danger-light w-full transition-colors min-h-[44px]"
          aria-label="Sair da área administrativa"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  );
}
