import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORGANIZATION_HEADER, isOrganizationSlug } from "@/lib/tenant-path";

/**
 * Organização (condomínio) da requisição e acesso a dados com escopo obrigatório.
 * docs/orken-cond/arquitetura.md, seção 2.
 *
 * Quem decide a organização é o CAMINHO (`/{slug}/...`): o middleware o lê no
 * servidor e o põe em `ORGANIZATION_HEADER`, sempre sobrescrevendo o que vier do
 * cliente. Aqui o slug vira organização ativa; desconhecida ou desativada é 404,
 * nunca outra organização. Não existe organização padrão.
 *
 * Duas camadas independentes:
 *  1. o cliente com escopo (`scopedClient`) filtra toda leitura por organizationId
 *     e preenche organizationId em toda escrita, inclusive aninhada;
 *  2. cada consulta roda numa transação com `app.organization_id`, que as políticas
 *     de RLS do banco exigem (migration 20261103000000_organizations).
 */

export { ORGANIZATION_HEADER, isOrganizationSlug } from "@/lib/tenant-path";

const ORGANIZATION_SELECT = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  protocolPrefix: true,
  datajudTribunal: true,
  accentColor: true,
  unitLayout: true,
  platformOrganizationId: true,
} as const;

export type OrganizationContext = Prisma.OrganizationGetPayload<{ select: typeof ORGANIZATION_SELECT }>;

/** Organização ativa com este slug, ou null (uma consulta por requisição). */
export const findActiveOrganization = cache(async (slug: string): Promise<OrganizationContext | null> => {
  if (!isOrganizationSlug(slug)) return null;
  return prisma.organization.findFirst({ where: { slug, status: "ACTIVE" }, select: ORGANIZATION_SELECT });
});

// ── Cliente com escopo ──────────────────────────────────────────────────────

type Model = Prisma.ModelName;
const MODELS = Prisma.dmmf.datamodel.models;
/** Modelos de domínio: os que têm organizationId (todos, menos Organization). */
const TENANT_MODELS: ReadonlySet<string> = new Set(
  MODELS.filter((model) => model.fields.some((field) => field.name === "organizationId")).map((model) => model.name)
);
/** Relações de cada modelo para outros modelos de domínio (escritas aninhadas). */
const TENANT_RELATIONS: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map(
  MODELS.map((model) => [
    model.name,
    new Map(
      model.fields
        .filter((field) => field.kind === "object" && TENANT_MODELS.has(field.type))
        .map((field) => [field.name, field.type])
    ),
  ])
);

const WHERE_MANY = new Set(["findMany", "findFirst", "findFirstOrThrow", "count", "aggregate", "groupBy", "updateMany", "deleteMany"]);
const WHERE_UNIQUE = new Set(["findUnique", "findUniqueOrThrow", "update", "delete"]);

type Args = Record<string, unknown>;

function withOrganization(model: string, data: unknown, organizationId: string): unknown {
  if (Array.isArray(data)) return data.map((item) => withOrganization(model, item, organizationId));
  if (!data || typeof data !== "object") return data;
  const out: Args = { ...(data as Args) };
  // Na criação, organizationId é sempre o da requisição: nunca o que veio do cliente.
  delete out.organization;
  out.organizationId = organizationId;
  const relations = TENANT_RELATIONS.get(model);
  for (const [field, target] of relations ?? []) {
    const nested = out[field];
    if (nested && typeof nested === "object") out[field] = nestedWrites(target, nested as Args, organizationId);
  }
  return out;
}

function nestedWrites(model: string, writes: Args, organizationId: string): Args {
  const out: Args = { ...writes };
  if (out.create) out.create = withOrganization(model, out.create, organizationId);
  if (out.createMany && typeof out.createMany === "object") {
    const createMany = out.createMany as Args;
    out.createMany = { ...createMany, data: withOrganization(model, createMany.data, organizationId) };
  }
  if (out.connectOrCreate) {
    const items = Array.isArray(out.connectOrCreate) ? out.connectOrCreate : [out.connectOrCreate];
    out.connectOrCreate = items.map((item: Args) => ({ ...item, create: withOrganization(model, item.create, organizationId) }));
  }
  return out;
}

function scopeArgs(model: string, operation: string, args: Args, organizationId: string): Args {
  if (WHERE_MANY.has(operation)) {
    return { ...args, where: { AND: [args.where ?? {}, { organizationId }] } };
  }
  if (WHERE_UNIQUE.has(operation)) {
    return { ...args, where: { ...(args.where as Args), organizationId } };
  }
  if (operation === "create") return { ...args, data: withOrganization(model, args.data, organizationId) };
  if (operation === "createMany" || operation === "createManyAndReturn") {
    return { ...args, data: withOrganization(model, args.data, organizationId) };
  }
  if (operation === "upsert") {
    return {
      ...args,
      where: { ...(args.where as Args), organizationId },
      create: withOrganization(model, args.create, organizationId),
    };
  }
  // Operação desconhecida num modelo de domínio: recusa em vez de rodar sem escopo.
  throw new Error(`operação sem escopo de organização: ${model}.${operation}`);
}

function setOrganization(organizationId: string) {
  return prisma.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, TRUE)`;
}

/** Cliente Prisma preso a uma organização. Nunca exportado sem escopo para o domínio. */
export function scopedClient(organizationId: string) {
  return prisma.$extends({
    name: "organization-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model as Model)) return query(args);
          const scoped = scopeArgs(model, operation, (args ?? {}) as Args, organizationId);
          const [, result] = await prisma.$transaction([setOrganization(organizationId), query(scoped as typeof args)]);
          return result;
        },
      },
    },
  });
}

export type ScopedClient = ReturnType<typeof scopedClient>;

/**
 * Transação interativa na organização: RLS ativo desde o primeiro comando. Dentro
 * dela o `tx` é o cliente base: toda escrita precisa trazer `organizationId` e toda
 * busca filtrar por ele (o RLS barra o resto no banco).
 */
export function organizationTransaction<T>(
  organizationId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, TRUE)`;
    return work(tx);
  });
}

// ── Organização da requisição ───────────────────────────────────────────────

export interface Tenant {
  org: OrganizationContext;
  db: ScopedClient;
}

/** Organização da requisição (do caminho, via middleware), ou null. */
export const getTenant = cache(async (): Promise<Tenant | null> => {
  const slug = (await headers()).get(ORGANIZATION_HEADER);
  if (!slug) return null;
  const org = await findActiveOrganization(slug);
  return org ? { org, db: scopedClient(org.id) } : null;
});

/** Página ou rota de condomínio: sem organização válida, 404 neutro. */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) notFound();
  return tenant;
}

/** Atalho para o acesso a dados da organização da requisição. */
export async function tenantDb(): Promise<ScopedClient> {
  return (await requireTenant()).db;
}
