import { createHash } from "node:crypto";
import { redis } from "@/lib/redis";

/**
 * Transação de login no Orken ID: guardada 10 min no Redis pelo hash do state (o
 * state em claro fica só no cookie do navegador) e consumida uma vez (GETDEL): login
 * CSRF, replay e state reusado não passam. Sem Redis fora de produção, memória.
 */

export interface OrkenTransaction {
  organizationId: string;
  slug: string;
  nonce: string;
  verifier: string;
}

const TTL_SECONDS = 600;
const memory = new Map<string, { value: string; expiresAt: number }>();

const key = (state: string) => `cond:orken:tx:${createHash("sha256").update(state).digest("base64url")}`;

export async function saveTransaction(state: string, tx: OrkenTransaction): Promise<void> {
  const client = redis();
  const value = JSON.stringify(tx);
  if (client) {
    await client.set(key(state), value, "EX", TTL_SECONDS);
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Redis indisponível");
  memory.set(key(state), { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}

export async function takeTransaction(state: string): Promise<OrkenTransaction | null> {
  const client = redis();
  let value: string | null = null;
  if (client) {
    value = await client.getdel(key(state));
  } else if (process.env.NODE_ENV !== "production") {
    const entry = memory.get(key(state));
    memory.delete(key(state));
    value = entry && entry.expiresAt > Date.now() ? entry.value : null;
  }
  if (!value) return null;
  try {
    const tx = JSON.parse(value) as OrkenTransaction;
    return typeof tx.organizationId === "string" && typeof tx.slug === "string" && typeof tx.nonce === "string" && typeof tx.verifier === "string"
      ? tx
      : null;
  } catch {
    return null;
  }
}
