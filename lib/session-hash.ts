import { createHash } from "node:crypto";

/** Hash do token de sessão (e do de CSRF): o banco nunca guarda o valor do cookie. */
export function tokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}
