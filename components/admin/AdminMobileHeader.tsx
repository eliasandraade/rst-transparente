"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, UserCircle } from "lucide-react";

interface Props {
  userName?: string | null;
}

export default function AdminMobileHeader({ userName }: Props) {
  return (
    <header className="md:hidden bg-white border-b border-border px-4 py-3 flex items-center justify-between">
      <span className="font-semibold text-sm">Área Administrativa</span>
      <div className="flex items-center gap-2">
        <Link
          href="/admin/perfil"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
        >
          <UserCircle className="w-4 h-4" />
          <span>{userName}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-danger transition-colors px-2 py-1 rounded hover:bg-muted"
          aria-label="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
