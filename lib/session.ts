import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AuthMethod } from "@prisma/client";
import type { ScopedClient } from "@/lib/tenant";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/session-cookies";
import { tokenHash } from "@/lib/session-hash";

export { tokenHash };

/**
 * Sessão da equipe no servidor (docs/orken-cond/identidade.md). O navegador guarda
 * um token opaco aleatório; o banco, só o hash. A sessão é de uma organização: o
 * cliente com escopo nem enxerga a de outra. Expira por inatividade e por idade, e
 * sai na hora quando revogada (logout, conta desativada, acesso negado na Platform).
 */

/** Sem uso por este tempo, a sessão acaba. */
export const IDLE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
/** Idade máxima, com uso ou sem. */
export const ABSOLUTE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
/** lastSeenAt só é regravado depois deste intervalo (uma escrita por requisição seria desperdício). */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

function cookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(ABSOLUTE_TIMEOUT_MS / 1000),
  };
}

export interface OpenedSession {
  id: string;
}

/** Abre a sessão e grava os cookies (sessão HttpOnly; CSRF legível pelo próprio site). */
export async function openSession(
  db: ScopedClient,
  input: { userId: string; authMethod: AuthMethod; idToken?: string | null }
): Promise<OpenedSession> {
  const token = newToken();
  const csrf = newToken();
  const session = await db.staffSession.create({
    data: {
      userId: input.userId,
      authMethod: input.authMethod,
      idToken: input.idToken ?? null,
      tokenHash: tokenHash(token),
      csrfHash: tokenHash(csrf),
      expiresAt: new Date(Date.now() + ABSOLUTE_TIMEOUT_MS),
    },
    select: { id: true },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(true));
  jar.set(CSRF_COOKIE, csrf, cookieOptions(false));
  return session;
}

/** Expira os cookies com os mesmos atributos: um `__Host-` sem `Secure` seria ignorado pelo navegador. */
export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(true), maxAge: 0 });
  jar.set(CSRF_COOKIE, "", { ...cookieOptions(false), maxAge: 0 });
}

export interface ActiveSession {
  id: string;
  userId: string;
  authMethod: AuthMethod;
  idToken: string | null;
  csrfHash: string;
}

/** Sessão válida do cookie, nesta organização; null se ausente, expirada ou revogada. */
export async function readSession(db: ScopedClient, now: number = Date.now()): Promise<ActiveSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const session = await db.staffSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: { id: true, userId: true, authMethod: true, idToken: true, csrfHash: true, lastSeenAt: true, expiresAt: true, revokedAt: true },
  });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() <= now || session.lastSeenAt.getTime() + IDLE_TIMEOUT_MS <= now) return null;
  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.staffSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } });
  }
  return { id: session.id, userId: session.userId, authMethod: session.authMethod, idToken: session.idToken, csrfHash: session.csrfHash };
}

/** O cookie de CSRF desta requisição é o da sessão (o middleware já conferiu cabeçalho = cookie). */
export async function csrfMatches(session: ActiveSession): Promise<boolean> {
  const csrf = (await cookies()).get(CSRF_COOKIE)?.value;
  if (!csrf) return false;
  const expected = Buffer.from(session.csrfHash);
  const actual = Buffer.from(tokenHash(csrf));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function revokeSession(db: ScopedClient, id: string, reason: string): Promise<void> {
  await db.staffSession.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: reason } });
}

/** Todas as sessões abertas da conta (vínculo ao Orken ID, conta desativada). */
export async function revokeUserSessions(
  db: ScopedClient,
  userId: string,
  reason: string,
  only?: AuthMethod
): Promise<number> {
  const { count } = await db.staffSession.updateMany({
    where: { userId, revokedAt: null, ...(only ? { authMethod: only } : {}) },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return count;
}
