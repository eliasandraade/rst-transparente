import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import bcrypt from "bcryptjs";

/**
 * Requisição simulada para chamar as rotas direto: a organização que o middleware
 * poria no cabeçalho e a sessão que o NextAuth devolveria. Os testes mockam
 * `next/headers` e `@/lib/auth` lendo daqui.
 */
export const ctx = {
  org: null as string | null,
  session: null as null | { user: { id: string; organizationId: string; organizationSlug: string; role: string } },
};

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
  staff: { id: string; email: string; role: string };
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
  return { id: org.id, slug: org.slug, staff: { id: staff.id, email: staff.email, role: staff.role } };
}

/** Próximas chamadas: no caminho de `org`, com a sessão da equipe de `signedIn` (ou sem sessão). */
export function as(org: TestOrganization | string | null, signedIn?: TestOrganization | null): void {
  ctx.org = typeof org === "string" || org === null ? org : org.slug;
  ctx.session = signedIn
    ? { user: { id: signedIn.staff.id, organizationId: signedIn.id, organizationSlug: signedIn.slug, role: signedIn.staff.role } }
    : null;
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
