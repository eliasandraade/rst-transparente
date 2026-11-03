import { NextResponse } from "next/server";

/**
 * Redirecionamento para um caminho deste site com `Location` relativo. Atrás do proxy
 * do Railway, a URL da requisição numa rota é a interna (`localhost:8080`); o caminho
 * relativo vale no host que o navegador usou.
 */
export function redirectTo(path: string, status: 302 | 303 | 307 = 303): NextResponse {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("redirecionamento só para caminho do próprio site");
  return new NextResponse(null, { status, headers: { location: path } });
}
