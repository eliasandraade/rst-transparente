import Redis from "ioredis";

/**
 * Cliente Redis compartilhado (rate limit, transações de login do Orken ID). Sem
 * `REDIS_URL`, null: quem usa decide (produção falha fechado; desenvolvimento e
 * testes de unidade usam memória).
 */
const globalForRedis = globalThis as unknown as { condRedis?: Redis | null };

export function redis(): Redis | null {
  if (globalForRedis.condRedis !== undefined) return globalForRedis.condRedis;
  const url = process.env.REDIS_URL;
  // A fila offline fica ligada (o primeiro comando espera a conexão abrir), mas com
  // prazos curtos: Redis fora vira erro em ~2 s, nunca uma espera longa.
  globalForRedis.condRedis = url ? new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 2_000, commandTimeout: 1_500 }) : null;
  globalForRedis.condRedis?.on("error", (error) => {
    console.error(`[redis] ${error.message}`);
  });
  return globalForRedis.condRedis;
}
