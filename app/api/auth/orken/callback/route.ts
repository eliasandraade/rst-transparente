import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { orkenConfig } from "@/lib/orken/config";
import { takeTransaction } from "@/lib/orken/transaction";
import { completeOrkenLogin } from "@/lib/orken/login";
import { ORKEN_TX_COOKIE } from "@/lib/session-cookies";
import { redirectTo } from "@/lib/redirect";
import { errorSummary } from "@/lib/privacy";

/**
 * Retorno do Orken ID (`orken-cond-web`). O state precisa ser o do cookie deste
 * navegador, e a transação sai do Redis uma vez só. Sucesso: painel do condomínio da
 * transação. Recusa: login dele, com o motivo. Sem transação: a página do produto,
 * nunca o portal de outro condomínio.
 */
export async function GET(request: Request) {
  const config = orkenConfig();
  const url = new URL(request.url);
  const go = (path: string) => {
    const response = redirectTo(path);
    // Mesmos atributos do cookie gravado: um `__Host-` sem `Secure` não seria apagado.
    response.cookies.set(ORKEN_TX_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  };
  if (!config) return go("/");

  const state = url.searchParams.get("state") ?? "";
  const bound = (await cookies()).get(ORKEN_TX_COOKIE)?.value ?? "";
  const sameBrowser =
    state.length > 0 && state.length === bound.length && timingSafeEqual(Buffer.from(state), Buffer.from(bound));
  const tx = sameBrowser ? await takeTransaction(state) : null;
  if (!tx) return go("/");

  try {
    const outcome = await completeOrkenLogin(config, tx, { code: url.searchParams.get("code"), error: url.searchParams.get("error") });
    if (outcome.ok) return go(`/${outcome.slug}/admin/dashboard`);
    return go(outcome.slug ? `/${outcome.slug}/admin/login?orken=${outcome.reason}` : "/");
  } catch (error) {
    console.error("[orken] callback", errorSummary(error));
    return go(`/${tx.slug}/admin/login?orken=erro`);
  }
}
