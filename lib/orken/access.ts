import { prisma } from "@/lib/prisma";
import { platformAccess, type AccessDecision } from "@/lib/orken/platform";
import type { OrkenConfig } from "@/lib/orken/config";

/**
 * Se a pessoa pode usar o COND agora, segundo a Platform: organização com o COND
 * habilitado e membership ativa com o grant do COND. O que ela faz lá dentro segue
 * decidido pelos papéis locais.
 *
 * A resposta fica em memória por 60 s, por organização, pessoa e versão de acesso
 * (platform_access_state, que o feed de eventos sobe: todas as réplicas perguntam de
 * novo na próxima requisição). Erro nunca é guardado: Platform fora do ar nunca vira
 * acesso, e quem chama falha fechado.
 */

export const ACCESS_CACHE_TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;

export type CondAccess = { allowed: true } | { allowed: false; reason: "product_not_enabled" | "no_access" };

const entries = new Map<string, { access: CondAccess; expiresAt: number }>();

export function toAccess(decision: AccessDecision | null): CondAccess {
  if (!decision) return { allowed: false, reason: "product_not_enabled" };
  return decision.allowed === true ? { allowed: true } : { allowed: false, reason: "no_access" };
}

export async function accessVersion(): Promise<number> {
  const row = await prisma.platformAccessState.findUnique({ where: { id: 1 }, select: { accessVersion: true } });
  return row?.accessVersion ?? 0;
}

/** Lança PlatformUnavailableError sem tocar no cache. */
export async function checkAccess(
  config: OrkenConfig,
  platformOrganizationId: string,
  subject: string,
  version: number,
  now: number = Date.now()
): Promise<CondAccess> {
  const key = `${platformOrganizationId}|${subject}|${version}`;
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now) return hit.access;
  const access = toAccess(await platformAccess(config, platformOrganizationId, subject));
  if (entries.size >= MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  entries.set(key, { access, expiresAt: now + ACCESS_CACHE_TTL_MS });
  return access;
}

/** Esquece tudo (evento relevante aplicado nesta réplica; as outras seguem pela versão). */
export function clearAccessCache(): void {
  entries.clear();
}
