import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import middleware from "./middleware";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from "./lib/session-cookies";

function request(path: string, init: { method?: string; headers?: Record<string, string>; cookies?: Record<string, string> } = {}) {
  const headers = new Headers({ host: "cond.test", ...init.headers });
  const cookie = Object.entries(init.cookies ?? {}).map(([k, v]) => `${k}=${v}`).join("; ");
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`https://cond.test${path}`, { method: init.method ?? "GET", headers });
}

const forwarded = (res: Response) => res.headers.get("x-middleware-request-x-cond-organization");

afterEach(() => {
  delete process.env.LEGACY_HOST_ORGANIZATION;
  delete process.env.LEGACY_HOST_TARGET;
});

describe("middleware", () => {
  it("a organização vem do caminho; a do cliente é descartada", () => {
    const res = middleware(request("/condominio-a/financeiro", { headers: { "x-cond-organization": "condominio-b" } }));
    expect(forwarded(res)).toBe("condominio-a");
    const product = middleware(request("/api/health", { headers: { "x-cond-organization": "condominio-b" } }));
    expect(forwarded(product)).toBeNull();
  });

  it("escrita na API de outra origem é recusada", () => {
    const res = middleware(request("/condominio-a/api/demandas", { method: "POST", headers: { origin: "https://outro.test" } }));
    expect(res.status).toBe(403);
    const ok = middleware(request("/condominio-a/api/demandas", { method: "POST", headers: { origin: "https://cond.test" } }));
    expect(ok.status).toBe(200);
  });

  it("com sessão, escrita sem o cabeçalho de CSRF igual ao cookie é recusada", () => {
    const cookies = { [SESSION_COOKIE]: "s", [CSRF_COOKIE]: "token-csrf" };
    const base = { method: "POST", cookies } as const;
    expect(middleware(request("/condominio-a/api/avisos", { ...base, headers: { origin: "https://cond.test" } })).status).toBe(403);
    expect(middleware(request("/condominio-a/api/avisos", { ...base, headers: { origin: "https://cond.test", [CSRF_HEADER]: "outro" } })).status).toBe(403);
    expect(middleware(request("/condominio-a/api/avisos", { ...base, headers: { origin: "https://cond.test", [CSRF_HEADER]: "token-csrf" } })).status).toBe(200);
    // O login abre sessão nova: basta a origem.
    expect(middleware(request("/condominio-a/api/auth/login", { ...base, headers: { origin: "https://cond.test" } })).status).toBe(200);
  });

  it("gestão sem cookie de sessão vai ao login do condomínio; o login fica aberto", () => {
    const res = middleware(request("/condominio-a/admin/avisos"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/condominio-a/admin/login");
    expect(new URL(res.headers.get("location")!).searchParams.get("callbackUrl")).toBe("/admin/avisos");
    expect(middleware(request("/condominio-a/admin/login")).status).toBe(200);
  });

  it("toda resposta sai com CSP de nonce próprio e cabeçalhos de segurança", () => {
    const first = middleware(request("/condominio-a"));
    const second = middleware(request("/"));
    const csp = first.headers.get("content-security-policy")!;
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]{20,}' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toBe(second.headers.get("content-security-policy"));
    // O Next recebe a mesma CSP na requisição para pôr o nonce nos próprios scripts.
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
    for (const res of [first, middleware(request("/condominio-a/api/demandas", { method: "POST", headers: { origin: "https://outro.test" } }))]) {
      expect(res.headers.get("strict-transport-security")).toContain("max-age=31536000");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
    }
  });

  it("cutover: host legado manda tudo para o mesmo caminho na origem do produto", () => {
    process.env.LEGACY_HOST_ORGANIZATION = "legado.test=condominio-a";
    process.env.LEGACY_HOST_TARGET = "https://cond.test";
    const legacy = (path: string, method = "GET") => middleware(request(path, { method, headers: { host: "legado.test" } }));
    const expectTarget = (path: string, target: string) => {
      const res = legacy(path);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe(target);
    };
    expectTarget("/", "https://cond.test/condominio-a");
    expectTarget("/financeiro?periodo=2026-06", "https://cond.test/condominio-a/financeiro?periodo=2026-06");
    expectTarget("/demandas/acompanhar/RST-2026-K7M9Q2", "https://cond.test/condominio-a/demandas/acompanhar/RST-2026-K7M9Q2");
    expectTarget("/condominio-a/admin/login", "https://cond.test/condominio-a/admin/login");
    expectTarget("/entrar/condominio-a", "https://cond.test/entrar/condominio-a");
    // 308 mantém o método: um POST antigo segue como POST (e a checagem de origem vale lá).
    expect(legacy("/api/demandas", "POST").headers.get("location")).toBe("https://cond.test/condominio-a/api/demandas");
    // Outro host não é afetado.
    expect(middleware(request("/condominio-a")).status).toBe(200);
  });

  it("host legado: 308 para o caminho do condomínio, exceto rotas do produto", () => {
    process.env.LEGACY_HOST_ORGANIZATION = "legado.test=condominio-a";
    const res = middleware(request("/demandas/acompanhar/RST-2026-K7M9Q2?x=1", { headers: { host: "legado.test" } }));
    expect(res.status).toBe(308);
    const target = new URL(res.headers.get("location")!);
    expect(target.pathname + target.search).toBe("/condominio-a/demandas/acompanhar/RST-2026-K7M9Q2?x=1");
    expect(middleware(request("/api/auth/orken/callback", { headers: { host: "legado.test" } })).status).toBe(200);
    expect(middleware(request("/condominio-a", { headers: { host: "legado.test" } })).status).toBe(200);
  });
});
