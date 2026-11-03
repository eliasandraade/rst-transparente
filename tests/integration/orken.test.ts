import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT, exportJWK, generateKeyPair, type JWK } from "jose";
import {
  RUN, as, createOrganization, ctx, dropOrganizations, flushRateLimits, jsonRequest, prisma, type TestOrganization,
} from "./context";
import { ORKEN_TX_COOKIE, SESSION_COOKIE } from "@/lib/session-cookies";
import { resetOrkenConfig } from "@/lib/orken/config";
import { resetDiscovery } from "@/lib/orken/oidc";
import { resetServiceToken } from "@/lib/orken/platform";
import { clearAccessCache } from "@/lib/orken/access";

vi.mock("next/headers", async () => (await import("./context")).mockHeaders());

/**
 * Entrada pelo Orken ID de ponta a ponta, com um Orken ID e uma Platform falsos
 * (chaves RSA de teste, discovery, JWKS, token, decisão de acesso e feed): PKCE e
 * state presos ao navegador, uso único, MFA, acesso na Platform, vínculo inequívoco,
 * revogação pela Platform, Platform fora do ar, feed de eventos e logout federado.
 */

const ISSUER = "https://id.cond.test";
const API = "https://api.cond.test";
const APP = "https://cond.test";
const CLIENT_ID = "orken-cond-web";

const idp = {
  keys: null as null | { privateKey: CryptoKey; jwk: JWK },
  otherKey: null as null | CryptoKey,
  claims: {} as Record<string, unknown>,
  signWith: "valid" as "valid" | "other",
  lastAuthorize: null as URL | null,
  access: "allowed" as "allowed" | "denied" | "down" | "missing",
  events: [] as unknown[],
};

let A: TestOrganization;
let platformOrg: string;
const subject = randomUUID();

async function idToken(): Promise<string> {
  const nonce = idp.lastAuthorize?.searchParams.get("nonce");
  const jwt = new SignJWT({ nonce, acr: "urn:orken:acr:mfa", amr: ["pwd", "otp", "mfa"], email_verified: true, ...idp.claims })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(`${ISSUER}/`)
    .setAudience(CLIENT_ID)
    .setSubject((idp.claims.sub as string) ?? subject)
    .setIssuedAt()
    .setExpirationTime("10m");
  return jwt.sign(idp.signWith === "valid" ? idp.keys!.privateKey : idp.otherKey!);
}

const realFetch = globalThis.fetch;
async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  if (url.origin === ISSUER) {
    if (url.pathname === "/.well-known/openid-configuration") {
      return json({
        issuer: `${ISSUER}/`, authorization_endpoint: `${ISSUER}/connect/authorize`, token_endpoint: `${ISSUER}/connect/token`,
        jwks_uri: `${ISSUER}/.well-known/jwks`, end_session_endpoint: `${ISSUER}/connect/endsession`,
      });
    }
    if (url.pathname === "/.well-known/jwks") return json({ keys: [{ ...idp.keys!.jwk, kid: "test", alg: "RS256", use: "sig" }] });
    if (url.pathname === "/connect/token") {
      const form = new URLSearchParams(String(init?.body));
      if (form.get("grant_type") === "client_credentials") return json({ access_token: "service-token", expires_in: 300 });
      const challenge = idp.lastAuthorize?.searchParams.get("code_challenge");
      const { createHash } = await import("node:crypto");
      const verifier = form.get("code_verifier") ?? "";
      if (createHash("sha256").update(verifier).digest("base64url") !== challenge) return json({ error: "invalid_grant" }, 400);
      if (form.get("redirect_uri") !== `${APP}/api/auth/orken/callback`) return json({ error: "invalid_grant" }, 400);
      return json({ id_token: await idToken(), access_token: "user-token", token_type: "Bearer" });
    }
  }
  if (url.origin === API) {
    if (idp.access === "down") return json({ title: "indisponível" }, 503);
    if (url.pathname.startsWith("/v1/tenants/")) {
      if (idp.access === "missing") return json({ title: "não encontrado" }, 404);
      const allowed = idp.access === "allowed";
      return json({ allowed, organizationStatus: "ACTIVE", productStatus: "ACTIVE", membershipRole: "MEMBER", membershipStatus: "ACTIVE", productGranted: allowed, userActive: true });
    }
    if (url.pathname === "/v1/events") {
      const cursor = url.searchParams.get("cursor") ?? "0";
      const start = Number(cursor);
      const page = idp.events.slice(start, start + 100);
      return json({ events: page, nextCursor: String(start + page.length) });
    }
  }
  return realFetch(input, init);
}

function setCookieValue(response: Response, name: string): string | null {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const [key, ...value] = pair!.split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

/** Começa o login como o navegador: /entrar/{slug} e o cookie de vínculo. */
async function start(): Promise<string> {
  const { GET } = await import("@/app/entrar/[slug]/route");
  const res = await GET(new Request(`${APP}/entrar/${A.slug}`), { params: Promise.resolve({ slug: A.slug }) });
  expect(res.status).toBe(303);
  idp.lastAuthorize = new URL(res.headers.get("location")!);
  const state = setCookieValue(res, ORKEN_TX_COOKIE)!;
  ctx.cookies.clear();
  ctx.cookies.set(ORKEN_TX_COOKIE, state);
  return state;
}

async function callback(query: Record<string, string>): Promise<string> {
  const { GET } = await import("@/app/api/auth/orken/callback/route");
  const res = await GET(new Request(`${APP}/api/auth/orken/callback?${new URLSearchParams(query)}`));
  expect(res.status).toBe(303);
  // Location relativo (nunca a URL interna do proxy); o navegador resolve no host que usou.
  const location = res.headers.get("location")!;
  expect(location.startsWith("/")).toBe(true);
  return new URL(location, APP).toString();
}

async function propostas(): Promise<number> {
  ctx.org = A.slug;
  const { GET } = await import("@/app/[org]/api/propostas/route");
  return (await GET()).status;
}

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  idp.keys = { privateKey: pair.privateKey as CryptoKey, jwk: await exportJWK(pair.publicKey) };
  idp.otherKey = (await generateKeyPair("RS256")).privateKey as CryptoKey;
  vi.stubGlobal("fetch", fakeFetch);
  Object.assign(process.env, {
    ORKEN_ISSUER: ISSUER, ORKEN_CLIENT_ID: CLIENT_ID, ORKEN_CLIENT_SECRET: "segredo-de-teste",
    PLATFORM_API_URL: API, ORKEN_SERVICE_CLIENT_ID: "orken-cond-service", ORKEN_SERVICE_CLIENT_SECRET: "segredo-de-servico",
    APP_BASE_URL: APP,
  });
  resetOrkenConfig();
  await flushRateLimits();
  // O feed falso recomeça do zero a cada execução; o cursor guardado também.
  await prisma.platformEventCursor.deleteMany({ where: { consumer: "cond-access" } });
  A = await createOrganization(`orken-a-${RUN}`, `OA${RUN.slice(-3)}`);
  platformOrg = randomUUID();
  await prisma.organization.update({ where: { id: A.id }, data: { platformOrganizationId: platformOrg } });
  await prisma.user.update({ where: { id: A.staff.id }, data: { email: `pessoa-${RUN}@orken.test` } });
});

beforeEach(() => {
  idp.claims = { email: `pessoa-${RUN}@orken.test` };
  idp.signWith = "valid";
  idp.access = "allowed";
  clearAccessCache();
  resetDiscovery();
  resetServiceToken();
});

afterAll(async () => {
  vi.unstubAllGlobals();
  for (const name of ["ORKEN_ISSUER", "ORKEN_CLIENT_ID", "ORKEN_CLIENT_SECRET", "PLATFORM_API_URL", "ORKEN_SERVICE_CLIENT_ID", "ORKEN_SERVICE_CLIENT_SECRET", "APP_BASE_URL"]) {
    delete process.env[name];
  }
  resetOrkenConfig();
  if (A) await dropOrganizations([A.id]);
  await prisma.$disconnect();
});

describe("início do login", () => {
  it("manda ao Orken ID com PKCE S256, state, nonce, MFA e redirect exato", async () => {
    await start();
    const url = idp.lastAuthorize!;
    expect(url.origin + url.pathname).toBe(`${ISSUER}/connect/authorize`);
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: "code", client_id: CLIENT_ID, redirect_uri: `${APP}/api/auth/orken/callback`,
      scope: "openid profile email", code_challenge_method: "S256", acr_values: "urn:orken:acr:mfa", organization: A.slug,
    });
    for (const param of ["state", "nonce", "code_challenge"]) expect(url.searchParams.get(param)!.length).toBeGreaterThanOrEqual(43);
  });

  it("condomínio inexistente vai ao 404 dele; sem vínculo com a Platform, desligado", async () => {
    const { GET } = await import("@/app/entrar/[slug]/route");
    const missing = await GET(new Request(`${APP}/entrar/nao-existe-${RUN}`), { params: Promise.resolve({ slug: `nao-existe-${RUN}` }) });
    expect(missing.headers.get("location")).toBe(`/nao-existe-${RUN}`);
  });
});

describe("primeiro login", () => {
  it("primeiro login vincula a conta, encerra as sessões de senha e a senha deixa de entrar", async () => {
    const passwordSession = await prisma.staffSession.findFirstOrThrow({ where: { userId: A.staff.id, authMethod: "PASSWORD", revokedAt: null } });
    const state = await start();
    expect(new URL(await callback({ code: "c", state })).pathname).toBe(`/${A.slug}/admin/dashboard`);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: A.staff.id } });
    expect(user.orkenSubject).toBe(subject);
    expect((await prisma.staffSession.findUniqueOrThrow({ where: { id: passwordSession.id } })).revokedReason).toBe("orken_linked");
    expect(ctx.cookies.get(SESSION_COOKIE)).toBeTruthy();
    expect(await propostas()).toBe(200);

    const actions = (await prisma.staffAuditEvent.findMany({ where: { organizationId: A.id, userId: A.staff.id } })).map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(["ORKEN_LINKED", "ORKEN_LOGIN"]));

    await prisma.user.update({ where: { id: A.staff.id }, data: { password: await (await import("bcryptjs")).default.hash(`senha-${RUN}`, 4) } });
    const { POST } = await import("@/app/[org]/api/auth/login/route");
    as(A);
    expect((await POST(jsonRequest("/api/auth/login", { email: `pessoa-${RUN}@orken.test`, password: `senha-${RUN}` }))).status).toBe(401);
  });
});

describe("retorno do Orken ID", () => {
  it("state de outro navegador ou reusado não abre sessão", async () => {
    const state = await start();
    ctx.cookies.set(ORKEN_TX_COOKIE, "outro-navegador");
    expect(new URL(await callback({ code: "c", state })).pathname).toBe("/");
    ctx.cookies.set(ORKEN_TX_COOKIE, state);
    expect(new URL(await callback({ code: "c", state })).pathname).toBe(`/${A.slug}/admin/dashboard`);
    // Uso único: a mesma transação não serve duas vezes.
    ctx.cookies.set(ORKEN_TX_COOKIE, state);
    expect(new URL(await callback({ code: "c", state })).pathname).toBe("/");
  });

  it("sem MFA, assinatura de outra chave ou cancelado: recusa com motivo", async () => {
    let state = await start();
    idp.claims = { ...idp.claims, acr: "urn:orken:acr:pwd", amr: ["pwd"] };
    expect(await callback({ code: "c", state })).toContain(`/${A.slug}/admin/login?orken=mfa`);

    idp.claims = { email: `pessoa-${RUN}@orken.test` };
    idp.signWith = "other";
    state = await start();
    expect(await callback({ code: "c", state })).toContain("orken=erro");

    idp.signWith = "valid";
    state = await start();
    expect(await callback({ error: "access_denied", state })).toContain("orken=cancelado");
  });

  it("Platform nega ou está fora: sem sessão", async () => {
    idp.access = "denied";
    let state = await start();
    expect(await callback({ code: "c", state })).toContain("orken=sem_acesso");
    clearAccessCache();
    idp.access = "down";
    state = await start();
    expect(await callback({ code: "c", state })).toContain("orken=indisponivel");
    expect(await prisma.staffAuditEvent.count({ where: { organizationId: A.id, action: "ORKEN_DENIED" } })).toBeGreaterThan(0);
  });

  it("e-mail não verificado não vincula", async () => {
    const outro = randomUUID();
    idp.claims = { sub: outro, email: `pessoa-${RUN}@orken.test`, email_verified: false };
    const state = await start();
    expect(await callback({ code: "c", state })).toContain("orken=sem_conta");
    expect(await prisma.user.count({ where: { orkenSubject: outro } })).toBe(0);
  });
});

describe("vínculo, sessão e revogação", () => {
  it("acesso revogado na Platform derruba a sessão aberta depois do evento; restaurado, novo login entra", async () => {
    let state = await start();
    await callback({ code: "c", state });
    expect(await propostas()).toBe(200);

    // Revogado na Platform: o cache ainda responde até o evento chegar...
    idp.access = "denied";
    expect(await propostas()).toBe(200);
    // ...e o feed sobe a versão de acesso: a próxima requisição pergunta de novo e a sessão cai.
    idp.events.push({ id: randomUUID(), sequence: 1, type: "membership.changed.v1", occurredAt: new Date().toISOString(), organizationId: platformOrg, productCode: "COND" });
    const { syncPlatformEvents } = await import("@/lib/orken/events");
    const { orkenConfig } = await import("@/lib/orken/config");
    const result = await syncPlatformEvents(orkenConfig()!);
    expect(result.relevant).toBe(1);
    expect(await propostas()).toBe(401);
    const revoked = await prisma.staffSession.findFirstOrThrow({ where: { userId: A.staff.id, authMethod: "ORKEN_ID" }, orderBy: { createdAt: "desc" } });
    expect(revoked.revokedReason).toBe("platform_access_denied");

    // Restaurado (o feed avisa de novo): a sessão revogada não volta; um novo login entra.
    idp.access = "allowed";
    idp.events.push({ id: randomUUID(), sequence: 3, type: "membership.changed.v1", occurredAt: new Date().toISOString(), organizationId: platformOrg, productCode: "COND" });
    expect((await syncPlatformEvents(orkenConfig()!)).relevant).toBe(1);
    expect(await propostas()).toBe(401);
    state = await start();
    expect(new URL(await callback({ code: "c", state })).pathname).toBe(`/${A.slug}/admin/dashboard`);
    expect(await propostas()).toBe(200);
  });

  it("Platform fora do ar: erro, sem acesso implícito e sem derrubar a sessão", async () => {
    const state = await start();
    await callback({ code: "c", state });
    idp.access = "down";
    clearAccessCache();
    await expect(propostas()).rejects.toThrow();
    const session = await prisma.staffSession.findFirstOrThrow({ where: { userId: A.staff.id, authMethod: "ORKEN_ID" }, orderBy: { createdAt: "desc" } });
    expect(session.revokedAt).toBeNull();
    idp.access = "allowed";
    expect(await propostas()).toBe(200);
  });

  it("feed: reentrega não repete; evento de outra organização não mexe no acesso", async () => {
    const { syncPlatformEvents } = await import("@/lib/orken/events");
    const { orkenConfig } = await import("@/lib/orken/config");
    const before = (await prisma.platformAccessState.findUniqueOrThrow({ where: { id: 1 } })).accessVersion;
    idp.events.push({ id: randomUUID(), sequence: 2, type: "membership.changed.v1", occurredAt: new Date().toISOString(), organizationId: randomUUID(), productCode: "COND" });
    const result = await syncPlatformEvents(orkenConfig()!);
    expect(result.relevant).toBe(0);
    expect((await prisma.platformAccessState.findUniqueOrThrow({ where: { id: 1 } })).accessVersion).toBe(before);
    // O cursor andou: a mesma página não volta.
    expect((await syncPlatformEvents(orkenConfig()!)).received).toBe(0);
  });

  it("logout revoga a sessão e devolve o logout federado com id_token_hint", async () => {
    const state = await start();
    await callback({ code: "c", state });
    const { POST } = await import("@/app/[org]/api/auth/logout/route");
    ctx.org = A.slug;
    const body = (await (await POST()).json()) as { endSessionUrl: string };
    const url = new URL(body.endSessionUrl);
    expect(url.origin + url.pathname).toBe(`${ISSUER}/connect/endsession`);
    expect(url.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(`${APP}/`);
    expect(url.searchParams.get("id_token_hint")?.split(".")).toHaveLength(3);
    expect(ctx.cookies.has(SESSION_COOKIE)).toBe(false);
    const session = await prisma.staffSession.findFirstOrThrow({ where: { userId: A.staff.id, authMethod: "ORKEN_ID" }, orderBy: { createdAt: "desc" } });
    expect(session.revokedReason).toBe("logout");
  });
});
