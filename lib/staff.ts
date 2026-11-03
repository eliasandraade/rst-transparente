import { cache } from "react";
import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { hasPermission, type Permission } from "@/lib/permissions";
import { orgRedirect } from "@/lib/org-server";
import { csrfMatches, readSession, revokeSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { orkenConfig } from "@/lib/orken/config";
import { accessVersion, checkAccess } from "@/lib/orken/access";
import { PlatformUnavailableError } from "@/lib/orken/platform";

/**
 * Pessoa da equipe com sessão válida NA organização do caminho, com papel e status
 * lidos do banco agora (conta desativada ou papel trocado valem na hora). Sessão
 * aberta pelo Orken ID ainda passa pela Platform a cada requisição (com cache curto
 * por versão de acesso): negada, a sessão é revogada; Platform fora do ar, erro
 * (PlatformUnavailableError), nunca um sim implícito nem logout por pane.
 * docs/orken-cond/identidade.md.
 */
export interface StaffSession {
  user: { id: string; name: string; email: string; role: string; organizationId: string; orkenLinked: boolean };
  session: { id: string; authMethod: "PASSWORD" | "ORKEN_ID"; idToken: string | null };
}

export const staffSession = cache(async (): Promise<StaffSession | null> => {
  const tenant = await getTenant();
  if (!tenant) return null;
  const { org, db } = tenant;
  const active = await readSession(db);
  if (!active || !(await csrfMatches(active))) return null;

  const user = await db.user.findUnique({
    where: { id: active.userId },
    select: { id: true, name: true, email: true, role: true, ativo: true, orkenSubject: true },
  });
  if (!user?.ativo) {
    await revokeSession(db, active.id, "account_inactive");
    return null;
  }
  // Depois do vínculo, a identidade é o Orken ID: sessão aberta com a senha local não vale mais.
  if (active.authMethod === "PASSWORD" && user.orkenSubject) {
    await revokeSession(db, active.id, "orken_linked");
    return null;
  }
  if (active.authMethod === "ORKEN_ID") {
    if (!user.orkenSubject) {
      await revokeSession(db, active.id, "orken_unlinked");
      return null;
    }
    const config = orkenConfig();
    if (!config || !org.platformOrganizationId) throw new PlatformUnavailableError("Orken ID não configurado para esta organização");
    const access = await checkAccess(config, org.platformOrganizationId, user.orkenSubject, await accessVersion());
    if (!access.allowed) {
      await revokeSession(db, active.id, "platform_access_denied");
      await audit(db, "PLATFORM_ACCESS_DENIED", { userId: user.id, subject: user.orkenSubject, detail: { reason: access.reason } });
      return null;
    }
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: org.id, orkenLinked: !!user.orkenSubject },
    session: { id: active.id, authMethod: active.authMethod, idToken: active.idToken },
  };
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
