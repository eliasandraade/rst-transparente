import type { Prisma } from "@prisma/client";
import type { ScopedClient } from "@/lib/tenant";

/**
 * Auditoria de acesso da equipe, por organização. Nunca recebe senha, token, código,
 * state, nonce ou segredo; o `sub` do Orken ID é um UUID opaco e pode entrar.
 */
export type StaffAuditAction =
  | "LOGIN_PASSWORD"
  | "LOGIN_FAILED"
  | "ORKEN_LOGIN"
  | "ORKEN_LINKED"
  | "ORKEN_DENIED"
  | "LOGOUT"
  | "PLATFORM_ACCESS_DENIED"
  | "SESSION_REVOKED";

export async function audit(
  db: ScopedClient,
  action: StaffAuditAction,
  input: { userId?: string | null; subject?: string | null; detail?: Prisma.InputJsonValue } = {}
): Promise<void> {
  await db.staffAuditEvent.create({
    data: { action, userId: input.userId ?? null, subject: input.subject ?? null, detail: input.detail },
  });
}
