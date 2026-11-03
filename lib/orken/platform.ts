import { discovery } from "@/lib/orken/oidc";
import type { OrkenConfig } from "@/lib/orken/config";

/**
 * Cliente de serviço `orken-cond-service` da Platform API v1: decisão de acesso e
 * feed de eventos. O produto (COND) é deduzido do cliente pela Platform, nunca de
 * parâmetro. Qualquer falha vira PlatformUnavailableError: quem chama falha fechado
 * e nunca guarda erro em cache.
 */

const TIMEOUT_MS = 5_000;

export class PlatformUnavailableError extends Error {}

export interface AccessDecision {
  allowed: boolean;
  organizationStatus: string;
  productStatus: string | null;
  membershipRole: string | null;
  membershipStatus: string | null;
  productGranted: boolean;
  userActive: boolean;
}

export interface PlatformEvent {
  id: string;
  sequence: number;
  type: string;
  occurredAt: string;
  organizationId: string | null;
  productCode: string | null;
}

let serviceToken: { value: string; expiresAt: number; key: string } | null = null;

async function token(config: OrkenConfig): Promise<string> {
  const key = `${config.issuer}|${config.serviceClientId}`;
  if (serviceToken && serviceToken.key === key && serviceToken.expiresAt > Date.now()) return serviceToken.value;
  try {
    const { doc } = await discovery(config);
    const res = await fetch(doc.token_endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${Buffer.from(`${encodeURIComponent(config.serviceClientId)}:${encodeURIComponent(config.serviceClientSecret)}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials", scope: "platform.tenancy.read platform.events.read" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new PlatformUnavailableError(`token de serviço respondeu ${res.status}`);
    const body = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof body.access_token !== "string") throw new PlatformUnavailableError("token de serviço ausente");
    const ttl = typeof body.expires_in === "number" ? body.expires_in : 300;
    serviceToken = { value: body.access_token, expiresAt: Date.now() + Math.max(ttl - 60, 30) * 1000, key };
    return serviceToken.value;
  } catch (error) {
    if (error instanceof PlatformUnavailableError) throw error;
    throw new PlatformUnavailableError("Orken ID indisponível para o cliente de serviço");
  }
}

async function get<T>(config: OrkenConfig, path: string): Promise<{ status: number; body: T | null }> {
  const bearer = await token(config);
  let res: Response;
  try {
    res = await fetch(`${config.platformApiUrl}${path}`, {
      headers: { authorization: `Bearer ${bearer}`, accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new PlatformUnavailableError("Platform sem resposta");
  }
  if (res.status === 401) serviceToken = null;
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw new PlatformUnavailableError(`Platform respondeu ${res.status}`);
  return { status: res.status, body: (await res.json()) as T };
}

/** Decisão de entrada; null quando a organização não tem o COND habilitado (a Platform responde 404). */
export async function platformAccess(config: OrkenConfig, organizationId: string, userId: string): Promise<AccessDecision | null> {
  const { body } = await get<AccessDecision>(config, `/v1/tenants/${encodeURIComponent(organizationId)}/access/${encodeURIComponent(userId)}`);
  return body;
}

export async function platformEvents(
  config: OrkenConfig,
  cursor: string | null,
  limit: number
): Promise<{ events: PlatformEvent[]; nextCursor: string }> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  const { body } = await get<{ events: PlatformEvent[]; nextCursor: string }>(config, `/v1/events?${query}`);
  if (!body || !Array.isArray(body.events) || typeof body.nextCursor !== "string") {
    throw new PlatformUnavailableError("página de eventos malformada");
  }
  return body;
}

/** Só para testes. */
export function resetServiceToken(): void {
  serviceToken = null;
}
