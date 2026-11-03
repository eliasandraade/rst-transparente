export const dynamic = "force-dynamic";

import { can, staffSession } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import Link from "@/lib/org-navigation";
import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import UsuarioRow from "@/components/admin/UsuarioRow";
import { orgRedirect } from "@/lib/org-server";

export const metadata: Metadata = { title: "Usuários" };

const LABEL_ROLE: Record<string, string> = {
  SINDICO: "Síndico",
  GESTAO: "Gestão",
  CONSELHO: "Conselheiro",
  MASTER: "Dev / Master",
};

export default async function UsuariosPage() {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session || !can(session, "usuarios.gerenciar")) {
    return orgRedirect("/admin/dashboard");
  }

  const usuarios = await db.user.findMany({
    where: { role: { not: "MASTER" } },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie quem tem acesso à área administrativa.
          </p>
        </div>
        <Link href="/admin/usuarios/novo" className="btn btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Novo usuário
        </Link>
      </div>

      {usuarios.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted-foreground text-lg mb-2">Nenhum usuário cadastrado ainda.</p>
          <p className="text-sm text-muted-foreground">
            Clique em &quot;Novo usuário&quot; para adicionar membros da equipe.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">E-mail</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Perfil</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((u) => (
                <UsuarioRow
                  key={u.id}
                  usuario={u}
                  labelRole={LABEL_ROLE[u.role] ?? u.role}
                  sessionRole={session.user.role}
                  sessionId={session.user.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
