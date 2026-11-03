import { NextResponse } from "next/server";
import { orkenConfig } from "@/lib/orken/config";
import { authorizeUrl, randomToken } from "@/lib/orken/oidc";
import { saveTransaction } from "@/lib/orken/transaction";
import { findActiveOrganization } from "@/lib/tenant";
import { isOrganizationSlug } from "@/lib/tenant-path";
import { ORKEN_TX_COOKIE } from "@/lib/session-cookies";

/**
 * Entrada da equipe pelo Orken ID: `/entrar/{slug}` (o cartão do COND na Minha Orken
 * abre aqui). Cria a transação (state, nonce, PKCE), prende o state a este navegador
 * e manda ao Orken ID pedindo MFA. Com sessão no Orken ID já com MFA, é só um redirect.
 * docs/orken-cond/identidade.md.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  if (!isOrganizationSlug(slug)) return back("/");

  const config = orkenConfig();
  const org = await findActiveOrganization(slug);
  // Inexistente ou desativada: o endereço dela responde o 404 neutro.
  if (!org) return back(`/${slug}`);
  if (!config || !org.platformOrganizationId) return back(`/${slug}/admin/login?orken=desligado`);

  const state = randomToken();
  try {
    const nonce = randomToken();
    const verifier = randomToken();
    await saveTransaction(state, { organizationId: org.id, slug: org.slug, nonce, verifier });
    const response = NextResponse.redirect(await authorizeUrl(config, { state, nonce, verifier, organization: org.slug }), 303);
    response.cookies.set(ORKEN_TX_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch (error) {
    console.error(`[orken] início do login: ${error instanceof Error ? error.message : "erro"}`);
    return back(`/${slug}/admin/login?orken=indisponivel`);
  }
}
