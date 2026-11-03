import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { clearSessionCookies, readSession, revokeSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { orkenConfig } from "@/lib/orken/config";
import { endSessionUrl } from "@/lib/orken/oidc";

/**
 * Saída da equipe. A sessão local é revogada e os cookies limpos antes de qualquer
 * chamada externa (vale com Orken ID ou Platform fora do ar). Sessão do Orken ID
 * recebe `endSessionUrl` (RP-Initiated Logout), para onde o navegador vai em seguida.
 */
export async function POST() {
  const { db } = await requireTenant();
  const session = await readSession(db);
  await clearSessionCookies();
  if (!session) return NextResponse.json({ endSessionUrl: null });

  await revokeSession(db, session.id, "logout");
  await audit(db, "LOGOUT", { userId: session.userId, detail: { authMethod: session.authMethod } });

  const config = orkenConfig();
  let url: string | null = null;
  if (session.authMethod === "ORKEN_ID" && config) {
    url = await endSessionUrl(config, session.idToken).catch(() => null);
  }
  return NextResponse.json({ endSessionUrl: url });
}
