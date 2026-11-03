import { redis } from "@/lib/redis";

/**
 * Limite de tentativas por janela fixa, compartilhado entre réplicas (Redis:
 * INCR + EXPIRE numa transação). Sem Redis em produção, nega (falha fechada): um
 * limite que some quando o Redis cai não protege nada. Fora de produção, sem
 * `REDIS_URL`, usa memória (desenvolvimento e testes de unidade).
 */

export interface RateLimitRule {
  /** Nome do limite (entra na chave): "demand-lookup", "login", ... */
  name: string;
  limit: number;
  windowSeconds: number;
}

export type RateLimitResult = { allowed: true } | { allowed: false; reason: "limited" | "unavailable" };

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, rule: RateLimitRule, now: number): RateLimitResult {
  const entry = memory.get(key);
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
    return { allowed: true };
  }
  entry.count++;
  return entry.count > rule.limit ? { allowed: false, reason: "limited" } : { allowed: true };
}

/** Conta uma tentativa de `subject` (IP, IP+conta, ...) e diz se ela cabe no limite. */
export async function rateLimit(rule: RateLimitRule, subject: string, now: number = Date.now()): Promise<RateLimitResult> {
  const key = `cond:ratelimit:${rule.name}:${subject}`;
  const client = redis();
  if (!client) {
    if (process.env.NODE_ENV === "production") return { allowed: false, reason: "unavailable" };
    return memoryHit(key, rule, now);
  }
  try {
    const results = await client.multi().incr(key).expire(key, rule.windowSeconds, "NX").exec();
    const count = Number(results?.[0]?.[1] ?? Number.POSITIVE_INFINITY);
    return count > rule.limit ? { allowed: false, reason: "limited" } : { allowed: true };
  } catch (error) {
    console.error(`[rate-limit] ${rule.name}: ${error instanceof Error ? error.message : String(error)}`);
    return { allowed: false, reason: "unavailable" };
  }
}

/** Só para testes de unidade. */
export function resetMemoryRateLimits(): void {
  memory.clear();
}

/** Limites das rotas sensíveis (por IP confiável, ver client-ip.ts). */
export const RATE_LIMITS = {
  login: { name: "login", limit: 10, windowSeconds: 300 },
  demandCreate: { name: "demand-create", limit: 5, windowSeconds: 600 },
  demandLookup: { name: "demand-lookup", limit: 5, windowSeconds: 60 },
  demandAttachment: { name: "demand-attachment", limit: 10, windowSeconds: 600 },
  proposalCreate: { name: "proposal-create", limit: 5, windowSeconds: 600 },
  pollVote: { name: "poll-vote", limit: 10, windowSeconds: 600 },
  adminUpload: { name: "admin-upload", limit: 30, windowSeconds: 600 },
} as const satisfies Record<string, RateLimitRule>;

/** Resposta padrão de limite atingido ou Redis fora. */
export function rateLimitResponseBody(result: Exclude<RateLimitResult, { allowed: true }>): { error: string } {
  return {
    error:
      result.reason === "limited"
        ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente."
        : "Serviço temporariamente indisponível. Tente novamente em instantes.",
  };
}
