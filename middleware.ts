import { NextResponse, type NextRequest } from "next/server";
import { ORGANIZATION_HEADER, isOrganizationSlug } from "@/lib/tenant-path";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from "@/lib/session-cookies";
import { STATIC_SECURITY_HEADERS, contentSecurityPolicy, newNonce } from "@/lib/security-headers";

// Runtime Edge: só caminho, cabeçalhos e cookies; sessão e conta são conferidas no servidor (lib/staff.ts).

/**
 * Host legado de um condomínio só ("www.transparenciarst.com.br=santissima-trindade"):
 * caminhos antigos (/financeiro, /admin/...) seguem funcionando, com 308 para o
 * caminho do condomínio. Lista em LEGACY_HOST_ORGANIZATION, separada por vírgula.
 */
function legacyOrganization(host: string | null): string | null {
  if (!host) return null;
  for (const entry of (process.env.LEGACY_HOST_ORGANIZATION ?? "").split(",")) {
    const [legacyHost, slug] = entry.split("=").map((part) => part.trim().toLowerCase());
    if (legacyHost && slug && legacyHost === host.toLowerCase() && isOrganizationSlug(slug)) return slug;
  }
  return null;
}

/** Caminhos do produto que nunca são de um condomínio. */
const PRODUCT_PATHS = /^\/(?:api\/(?:auth|health)(?:\/|$)|entrar\/|_next\/|brand\/|favicon|robots\.txt|sitemap\.xml)/;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

function forbidden(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Toda resposta sai com CSP (nonce desta requisição) e os demais cabeçalhos de segurança. */
function secured(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  for (const [name, value] of STATIC_SECURITY_HEADERS) response.headers.set(name, value);
  return response;
}

export default function middleware(req: NextRequest) {
  const nonce = newNonce();
  const csp = contentSecurityPolicy(nonce);
  return secured(route(req, nonce, csp), csp);
}

function route(req: NextRequest, nonce: string, csp: string): NextResponse {
  const { pathname, search } = req.nextUrl;

  const legacy = legacyOrganization(req.headers.get("host"));
  if (legacy && !PRODUCT_PATHS.test(pathname) && !pathname.startsWith(`/${legacy}/`) && pathname !== `/${legacy}`) {
    const target = req.nextUrl.clone();
    target.pathname = pathname === "/" ? `/${legacy}` : `/${legacy}${pathname}`;
    target.search = search;
    return NextResponse.redirect(target, 308);
  }

  const slug = pathname.split("/")[1];
  // O servidor decide a organização pelo caminho; o cabeçalho que vier do cliente é descartado.
  const headers = new Headers(req.headers);
  headers.delete(ORGANIZATION_HEADER);
  // O Next lê o nonce da CSP da requisição e o põe nos próprios scripts; o layout o passa ao tema.
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  if (!isOrganizationSlug(slug)) return NextResponse.next({ request: { headers } });
  headers.set(ORGANIZATION_HEADER, slug);

  const rest = pathname.slice(slug.length + 1) || "/";
  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;

  // Escritas na API: só do próprio site; com sessão, o cabeçalho de CSRF precisa
  // repetir o cookie (que outro site não lê nem grava, `__Host-`).
  if (rest.startsWith("/api/") && !SAFE_METHODS.has(req.method)) {
    if (!sameOrigin(req)) return forbidden("Origem não permitida.");
    // O login abre uma sessão nova; basta a origem (sessão velha não bloqueia entrar de novo).
    if (hasSession && rest !== "/api/auth/login") {
      const cookie = req.cookies.get(CSRF_COOKIE)?.value ?? "";
      const header = req.headers.get(CSRF_HEADER) ?? "";
      if (!cookie || cookie !== header) return forbidden("Sessão expirada. Recarregue a página.");
    }
  }

  // Atalho para quem nem tem sessão: a conta é conferida no banco pelas páginas
  // (requireStaff), e o login manda ao painel só quem o banco aceitar (login/layout.tsx).
  const isAdminRoute = rest === "/admin" || rest.startsWith("/admin/");
  if (isAdminRoute && rest !== "/admin/login" && !hasSession) {
    const loginUrl = new URL(`/${slug}/admin/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", rest);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
