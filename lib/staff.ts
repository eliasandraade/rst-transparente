import { cache } from "react";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenant } from "@/lib/tenant";
import { hasPermission, type Permission } from "@/lib/permissions";
import { orgRedirect } from "@/lib/org-server";

/**
 * Pessoa da equipe autenticada NA organização do caminho, com papel e status lidos
 * do banco agora (nunca do token: conta desativada ou papel trocado valem na hora).
 * Sessão de outra organização não vale aqui. Mesmo formato de antes
 * (`session.user.role`) para as rotas não mudarem de forma.
 */
export interface StaffSession {
  user: { id: string; name: string; email: string; role: string; organizationId: string };
}

export const staffSession = cache(async (): Promise<StaffSession | null> => {
  const [session, tenant] = await Promise.all([auth(), getTenant()]);
  const userId = session?.user?.id;
  if (!userId || !tenant) return null;
  if (session.user.organizationId !== tenant.org.id) return null;
  const user = await tenant.db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, ativo: true },
  });
  if (!user?.ativo) return null;
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: tenant.org.id } };
});

/**
 * Páginas da gestão: sem sessão válida neste condomínio, vai para o login dele. Cada
 * página chama, além do layout: layout e página renderizam em paralelo, e o dado
 * só sai depois da checagem feita no próprio componente que o busca.
 */
export async function requireStaff(): Promise<StaffSession> {
  const session = await staffSession();
  if (!session) return orgRedirect("/admin/login");
  return session;
}

export function can(session: StaffSession | null, permission: Permission): boolean {
  return !!session && hasPermission(session.user.role, permission);
}

/** Resposta padrão de quem está na sessão mas não tem o papel. */
export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Sem permissão para esta ação." }, { status: 403 });
}
