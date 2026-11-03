import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import bcrypt from "bcryptjs";
import { tokenHash } from "@/lib/session-hash";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/session-cookies";

/**
 * Requisição simulada para chamar as rotas direto: a organização que o middleware
 * poria no cabeçalho e os cookies do navegador. Os testes mockam `next/headers`
 * lendo e gravando aqui (mockHeaders).
 */
export const ctx = {
  org: null as string | null,
  cookies: new Map<string, string>(),
};

/** Fábrica do mock de `next/headers` (use em vi.mock com import dinâmico deste arquivo). */
export function mockHeaders() {
  return {
    headers: async () => new Headers(ctx.org ? { "x-cond-organization": ctx.org } : {}),
    cookies: async () => ({
      get: (name: string) => (ctx.cookies.has(name) ? { name, value: ctx.cookies.get(name)! } : undefined),
      // Expirar (maxAge 0) é como o navegador apaga o cookie.
      set: (name: string, value: string, options?: { maxAge?: number }) =>
        void (options?.maxAge === 0 ? ctx.cookies.delete(name) : ctx.cookies.set(name, value)),
      delete: (name: string) => void ctx.cookies.delete(name),
    }),
  };
}

/**
 * Banco de teste pelo dono das tabelas: prepara dados e confere o efeito das rotas.
 * Com ADMIN_DATABASE_URL, as rotas rodam com DATABASE_URL (papel cond_app, RLS
 * valendo) e a preparação com o dono; sem ela, tudo com DATABASE_URL.
 */
export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL } },
});

export const RUN = `${Date.now()}`.slice(-8);

let ipCounter = 0;
export const nextIp = () => `198.51.100.${(ipCounter++ % 250) + 1}`;

export function jsonRequest(url: string, body: unknown, method = "POST", ip = nextIp()): Request {
  return new Request(`http://cond.test${url}`, {
    method,
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

export function params<T extends Record<string, string>>(value: T): { params: Promise<T> } {
  return { params: Promise.resolve(value) };
}

export interface TestOrganization {
  id: string;
  slug: string;
  staff: { id: string; email: string; role: string; token: string; csrf: string };
}

/** Organização sintética (só em banco de teste) com uma conta da equipe. */
export async function createOrganization(slug: string, prefix: string, role = "GESTAO"): Promise<TestOrganization> {
  const org = await prisma.organization.create({
    data: { slug, name: `Condomínio ${slug}`, shortName: slug, protocolPrefix: prefix, datajudTribunal: "TJCE" },
  });
  const staff = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: `equipe-${RUN}@${slug}.test`,
      name: `Equipe ${slug}`,
      password: await bcrypt.hash(`senha-${RUN}`, 4),
      role: role as never,
    },
  });
  const created: TestOrganization = { id: org.id, slug: org.slug, staff: { id: staff.id, email: staff.email, role: staff.role, token: "", csrf: "" } };
  await newSession(created);
  return created;
}

/** Sessão nova para a equipe da organização, como o login abriria: o banco guarda só os hashes. */
export async function newSession(org: TestOrganization, authMethod: "PASSWORD" | "ORKEN_ID" = "PASSWORD"): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(32).toString("base64url");
  await prisma.staffSession.create({
    data: {
      organizationId: org.id, userId: org.staff.id, authMethod,
      tokenHash: tokenHash(token), csrfHash: tokenHash(csrf), expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  org.staff.token = token;
  org.staff.csrf = csrf;
}

/** Próximas chamadas: no caminho de `org`, com os cookies da sessão da equipe de `signedIn` (ou sem sessão). */
export function as(org: TestOrganization | string | null, signedIn?: TestOrganization | null): void {
  ctx.org = typeof org === "string" || org === null ? org : org.slug;
  ctx.cookies.clear();
  if (signedIn) {
    ctx.cookies.set(SESSION_COOKIE, signedIn.staff.token);
    ctx.cookies.set(CSRF_COOKIE, signedIn.staff.csrf);
  }
}

/** Apaga tudo das organizações de teste (na ordem das chaves estrangeiras). */
export async function dropOrganizations(ids: string[]): Promise<void> {
  const where = { organizationId: { in: ids } };
  await prisma.votoEnquete.deleteMany({ where });
  await prisma.opcaoEnquete.deleteMany({ where });
  await prisma.enquete.deleteMany({ where });
  await prisma.demandUpdate.deleteMany({ where });
  await prisma.demand.deleteMany({ where });
  await prisma.multa.deleteMany({ where });
  await prisma.notificacao.deleteMany({ where });
  await prisma.juridicoAuditoria.deleteMany({ where });
  await prisma.processo.deleteMany({ where });
  await prisma.lancamento.deleteMany({ where });
  await prisma.categoria.deleteMany({ where });
  await prisma.aviso.deleteMany({ where });
  await prisma.obra.deleteMany({ where });
  await prisma.proposta.deleteMany({ where });
  await prisma.membro.deleteMany({ where });
  await prisma.parecer.deleteMany({ where });
  await prisma.planilhaDownload.deleteMany({ where });
  await prisma.configPortal.deleteMany({ where });
  await prisma.staffAuditEvent.deleteMany({ where });
  await prisma.staffSession.deleteMany({ where });
  await prisma.user.deleteMany({ where });
  await prisma.organization.deleteMany({ where: { id: { in: ids } } });
}

export async function flushRateLimits(): Promise<void> {
  if (!process.env.REDIS_URL) return;
  const redis = new Redis(process.env.REDIS_URL);
  const keys = await redis.keys("cond:ratelimit:*");
  if (keys.length) await redis.del(...keys);
  redis.disconnect();
}
