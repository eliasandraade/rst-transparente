import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse, type NextRequest } from "next/server";
import { ORGANIZATION_HEADER, isOrganizationSlug } from "@/lib/tenant-path";

// Runtime Edge: só a configuração sem provedor (auth.config.ts); nada de Prisma ou Redis aqui.
const { auth } = NextAuth(authConfig);

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
const PRODUCT_PATHS = /^\/(?:api\/(?:auth|health)(?:\/|$)|_next\/|favicon|robots\.txt|sitemap\.xml)/;

export default auth((req) => {
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
  if (!isOrganizationSlug(slug)) return NextResponse.next({ request: { headers } });
  headers.set(ORGANIZATION_HEADER, slug);

  const rest = pathname.slice(slug.length + 1) || "/";
  const isAdminRoute = rest === "/admin" || rest.startsWith("/admin/");
  const isLoginPage = rest === "/admin/login";
  // Sessão só vale no condomínio em que foi aberta; papel e status são conferidos no servidor.
  const signedInHere = req.auth?.user?.organizationSlug === slug;

  if (isAdminRoute && !isLoginPage && !signedInHere) {
    const loginUrl = new URL(`/${slug}/admin/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", rest);
    return NextResponse.redirect(loginUrl);
  }
  if (isLoginPage && signedInHere) {
    return NextResponse.redirect(new URL(`/${slug}/admin/dashboard`, req.url));
  }
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
