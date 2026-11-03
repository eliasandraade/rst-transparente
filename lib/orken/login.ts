import { findActiveOrganization, organizationTransaction, scopedClient, type OrganizationContext } from "@/lib/tenant";
import { openSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { accessVersion, checkAccess } from "@/lib/orken/access";
import { exchangeCode, verifyIdToken, type IdentityClaims } from "@/lib/orken/oidc";
import { PlatformUnavailableError } from "@/lib/orken/platform";
import type { OrkenConfig } from "@/lib/orken/config";
import type { OrkenTransaction } from "@/lib/orken/transaction";

/**
 * Fim do login pelo Orken ID (docs/orken-cond/identidade.md, seções 4 e 5): ID token
 * conferido, MFA, organização ainda ativa, acesso na Platform, conta local da
 * organização (por `sub`, ou o primeiro vínculo quando tudo é inequívoco), sessão.
 * Cada recusa tem um motivo que a tela de login explica sem detalhe técnico.
 */

export type OrkenRefusal =
  | "desligado"
  | "cancelado"
  | "expirado"
  | "mfa"
  | "sem_acesso"
  | "sem_conta"
  | "inativa"
  | "indisponivel"
  | "erro";

export type OrkenOutcome = { ok: true; slug: string } | { ok: false; slug: string | null; reason: OrkenRefusal };

export async function completeOrkenLogin(
  config: OrkenConfig,
  tx: OrkenTransaction,
  input: { code: string | null; error: string | null }
): Promise<OrkenOutcome> {
  const org = await findActiveOrganization(tx.slug);
  if (!org || org.id !== tx.organizationId) return { ok: false, slug: null, reason: "expirado" };
  const refuse = (reason: OrkenRefusal): OrkenOutcome => ({ ok: false, slug: org.slug, reason });

  if (input.error) return refuse(input.error === "access_denied" ? "cancelado" : "erro");
  if (!input.code) return refuse("erro");
  if (!org.platformOrganizationId) return refuse("desligado");

  let idToken: string;
  let claims: IdentityClaims;
  try {
    idToken = await exchangeCode(config, input.code, tx.verifier);
    claims = await verifyIdToken(config, idToken, tx.nonce);
  } catch (error) {
    console.error(`[orken] callback: ${error instanceof Error ? error.message : "erro"}`);
    return refuse("erro");
  }
  if (!claims.mfa) return refuse("mfa");

  const db = scopedClient(org.id);
  try {
    const access = await checkAccess(config, org.platformOrganizationId, claims.sub, await accessVersion());
    if (!access.allowed) {
      await audit(db, "ORKEN_DENIED", { subject: claims.sub, detail: { reason: access.reason } });
      return refuse("sem_acesso");
    }
  } catch (error) {
    if (error instanceof PlatformUnavailableError) return refuse("indisponivel");
    throw error;
  }

  const account = await localAccount(org, claims);
  if (!account.ok) {
    await audit(db, "ORKEN_DENIED", { subject: claims.sub, detail: { reason: account.reason } });
    return refuse(account.reason);
  }

  await openSession(db, { userId: account.userId, authMethod: "ORKEN_ID", idToken });
  await audit(db, "ORKEN_LOGIN", { userId: account.userId, subject: claims.sub });
  return { ok: true, slug: org.slug };
}

/**
 * Conta local da organização: a já vinculada a este `sub`, ou o primeiro vínculo,
 * só quando o Orken ID diz que o e-mail é verificado e existe exatamente uma conta
 * ativa desta organização com esse e-mail, sem outro vínculo. O vínculo revoga as
 * sessões abertas com a senha e é auditado, numa transação; o índice único
 * (organização, sub) resolve corrida.
 */
async function localAccount(
  org: OrganizationContext,
  claims: IdentityClaims
): Promise<{ ok: true; userId: string } | { ok: false; reason: "sem_conta" | "inativa" }> {
  const db = scopedClient(org.id);
  const linked = await db.user.findFirst({ where: { orkenSubject: claims.sub }, select: { id: true, ativo: true } });
  if (linked) return linked.ativo ? { ok: true, userId: linked.id } : { ok: false, reason: "inativa" };

  if (!claims.emailVerified || !claims.email) return { ok: false, reason: "sem_conta" };
  const candidates = await db.user.findMany({
    where: { email: claims.email },
    select: { id: true, ativo: true, orkenSubject: true },
    take: 2,
  });
  if (candidates.length !== 1) return { ok: false, reason: "sem_conta" };
  const [candidate] = candidates;
  if (candidate.orkenSubject) return { ok: false, reason: "sem_conta" };
  if (!candidate.ativo) return { ok: false, reason: "inativa" };

  const linkedNow = await organizationTransaction(org.id, async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: candidate.id, organizationId: org.id, orkenSubject: null, ativo: true },
      data: { orkenSubject: claims.sub, orkenLinkedAt: new Date() },
    });
    if (count !== 1) return false;
    await tx.staffSession.updateMany({
      where: { userId: candidate.id, organizationId: org.id, authMethod: "PASSWORD", revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "orken_linked" },
    });
    await tx.staffAuditEvent.create({
      data: { organizationId: org.id, action: "ORKEN_LINKED", userId: candidate.id, subject: claims.sub },
    });
    return true;
  }).catch(() => false);
  return linkedNow ? { ok: true, userId: candidate.id } : { ok: false, reason: "sem_conta" };
}
