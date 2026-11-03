import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const ROLES_GESTAO_USUARIOS = ["MASTER", "SINDICO"];

// Runtime Edge: só a configuração sem provedor (auth.config.ts); nada de Prisma ou Redis aqui.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const isUsuariosRoute = req.nextUrl.pathname.startsWith("/admin/usuarios");
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role as string | undefined;

  // Redireciona para login se tentar acessar área admin sem autenticação
  if (isAdminRoute && !isLoginPage && !isAuthenticated) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona para dashboard se já autenticado e tenta acessar login
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Protege /admin/usuarios — apenas MASTER e SINDICO
  if (isUsuariosRoute && isAuthenticated && !ROLES_GESTAO_USUARIOS.includes(userRole ?? "")) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
