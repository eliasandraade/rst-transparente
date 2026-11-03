import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { callbackUrl, isUuid, postLogoutUrl, type OrkenConfig } from "@/lib/orken/config";

/**
 * Cliente OIDC do `orken-cond-web` (docs/orken-cond/identidade.md): Authorization
 * Code com PKCE S256, state, nonce e redirect exato; MFA pedido ao Orken ID e
 * conferido no ID token. Nada daqui vai para log: código, state, nonce, verifier,
 * tokens e segredos.
 */

export const MFA_ACR = "urn:orken:acr:mfa";
const TIMEOUT_MS = 10_000;

export class OidcError extends Error {}

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

const discoveries = new Map<string, { doc: Discovery; jwks: ReturnType<typeof createRemoteJWKSet>; expiresAt: number }>();

export async function discovery(config: OrkenConfig): Promise<{ doc: Discovery; jwks: ReturnType<typeof createRemoteJWKSet> }> {
  const hit = discoveries.get(config.issuer);
  if (hit && hit.expiresAt > Date.now()) return hit;
  const res = await fetch(`${config.issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new OidcError(`discovery respondeu ${res.status}`);
  const doc = (await res.json()) as Discovery;
  // O emissor anunciado precisa ser o configurado, e os endpoints, dele.
  if (new URL(doc.issuer).origin !== config.issuer) throw new OidcError("discovery de outro emissor");
  for (const endpoint of [doc.authorization_endpoint, doc.token_endpoint, doc.jwks_uri]) {
    if (new URL(endpoint).origin !== config.issuer) throw new OidcError("endpoint fora do emissor");
  }
  const entry = { doc, jwks: createRemoteJWKSet(new URL(doc.jwks_uri)), expiresAt: Date.now() + 60 * 60 * 1000 };
  discoveries.set(config.issuer, entry);
  return entry;
}

const b64url = (bytes: Buffer) => bytes.toString("base64url");
export const randomToken = () => b64url(randomBytes(32));
export const pkceChallenge = (verifier: string) => b64url(createHash("sha256").update(verifier).digest());

export async function authorizeUrl(
  config: OrkenConfig,
  input: { state: string; nonce: string; verifier: string; organization: string }
): Promise<string> {
  const { doc } = await discovery(config);
  const url = new URL(doc.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: callbackUrl(config),
    scope: "openid profile email",
    state: input.state,
    nonce: input.nonce,
    code_challenge: input.verifier ? pkceChallenge(input.verifier) : "",
    code_challenge_method: "S256",
    acr_values: MFA_ACR,
    // Só dica de interface para o Orken ID; quem decide o acesso é a Platform.
    organization: input.organization,
  }).toString();
  return url.toString();
}

function basicAuth(id: string, secret: string): string {
  return `Basic ${Buffer.from(`${encodeURIComponent(id)}:${encodeURIComponent(secret)}`).toString("base64")}`;
}

/** Troca o código pelo ID token (cliente confidencial, client_secret_basic). */
export async function exchangeCode(config: OrkenConfig, code: string, verifier: string): Promise<string> {
  const { doc } = await discovery(config);
  const res = await fetch(doc.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: basicAuth(config.clientId, config.clientSecret) },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: callbackUrl(config), code_verifier: verifier }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new OidcError(`token respondeu ${res.status}`);
  const body = (await res.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") throw new OidcError("resposta sem id_token");
  return body.id_token;
}

export interface IdentityClaims {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  mfa: boolean;
}

/**
 * Assinatura RS256 pela chave do JWKS do emissor, `iss` idêntico, `aud` com o
 * cliente (e `azp`, se houver), validade com 60 s de folga e no máximo 10 min de
 * idade, `nonce` da transação, `sub` UUID. MFA: `acr` de MFA e `amr` com `mfa`.
 */
export async function verifyIdToken(config: OrkenConfig, idToken: string, nonce: string): Promise<IdentityClaims> {
  const { doc, jwks } = await discovery(config);
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(idToken, jwks, {
      issuer: doc.issuer,
      audience: config.clientId,
      algorithms: ["RS256"],
      clockTolerance: 60,
      maxTokenAge: "10m",
      requiredClaims: ["sub", "iat", "exp", "nonce"],
    }));
  } catch (error) {
    throw new OidcError(`ID token recusado: ${error instanceof Error ? error.name : "erro"}`);
  }
  if (payload.nonce !== nonce) throw new OidcError("nonce não confere");
  if (payload.azp !== undefined && payload.azp !== config.clientId) throw new OidcError("azp de outro cliente");
  if (!isUuid(payload.sub)) throw new OidcError("sub inválido");
  const amr = Array.isArray(payload.amr) ? payload.amr : [];
  return {
    sub: payload.sub.toLowerCase(),
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
    mfa: payload.acr === MFA_ACR && amr.includes("mfa"),
  };
}

/** RP-Initiated Logout: encerra a sessão do Orken ID e volta à página do produto. */
export async function endSessionUrl(config: OrkenConfig, idToken: string | null): Promise<string | null> {
  const { doc } = await discovery(config);
  if (!doc.end_session_endpoint) return null;
  const url = new URL(doc.end_session_endpoint);
  const params = new URLSearchParams({ client_id: config.clientId, post_logout_redirect_uri: postLogoutUrl(config), state: randomToken() });
  if (idToken) params.set("id_token_hint", idToken);
  url.search = params.toString();
  return url.toString();
}

/** Só para testes. */
export function resetDiscovery(): void {
  discoveries.clear();
}
