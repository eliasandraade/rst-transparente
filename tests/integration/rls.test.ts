import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { RUN, createOrganization, dropOrganizations, prisma, type TestOrganization } from "./context";

/**
 * Segunda camada: o banco sozinho, sem o cliente com escopo. Conectado pelo papel
 * de runtime (cond_app, sem BYPASSRLS), sem `app.organization_id` nada aparece, e
 * com ele só as linhas daquela organização; escrever em outra é recusado.
 * Roda quando a suíte tem ADMIN_DATABASE_URL (DATABASE_URL é o papel de runtime).
 */
const runtimeRole = !!process.env.ADMIN_DATABASE_URL;

describe.skipIf(!runtimeRole)("RLS no banco (papel de runtime)", () => {
  const app = new PrismaClient();
  let A: TestOrganization;
  let B: TestOrganization;

  beforeAll(async () => {
    A = await createOrganization(`rls-a-${RUN}`, `RA${RUN.slice(-3)}`);
    B = await createOrganization(`rls-b-${RUN}`, `RB${RUN.slice(-3)}`);
    await prisma.aviso.createMany({
      data: [
        { organizationId: A.id, titulo: "A1", corpo: "a" },
        { organizationId: A.id, titulo: "A2", corpo: "a" },
        { organizationId: B.id, titulo: "B1", corpo: "b" },
      ],
    });
  });

  afterAll(async () => {
    await dropOrganizations([A?.id, B?.id].filter(Boolean));
    await app.$disconnect();
  });

  async function inOrganization<T>(organizationId: string | null, work: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return app.$transaction(async (tx) => {
      if (organizationId) await tx.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, TRUE)`;
      return work(tx as unknown as PrismaClient);
    });
  }

  it("o papel não contorna RLS", async () => {
    const [role] = await app.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it("sem organização definida, nenhuma linha de domínio", async () => {
    expect(await inOrganization(null, (tx) => tx.aviso.count({ where: { organizationId: { in: [A.id, B.id] } } }))).toBe(0);
    expect(await inOrganization(null, (tx) => tx.user.count({ where: { organizationId: { in: [A.id, B.id] } } }))).toBe(0);
  });

  it("com a organização, só as linhas dela, mesmo pedindo as da outra", async () => {
    const titulos = await inOrganization(A.id, (tx) => tx.aviso.findMany({ where: { organizationId: { in: [A.id, B.id] } }, select: { titulo: true } }));
    expect(titulos.map((aviso) => aviso.titulo).sort()).toEqual(["A1", "A2"]);
    expect(await inOrganization(A.id, (tx) => tx.aviso.count({ where: { organizationId: B.id } }))).toBe(0);
  });

  it("escrever ou mover linha para outra organização é recusado", async () => {
    await expect(inOrganization(A.id, (tx) => tx.aviso.create({ data: { organizationId: B.id, titulo: "invasão", corpo: "x" } }))).rejects.toThrow();
    const a1 = await prisma.aviso.findFirstOrThrow({ where: { organizationId: A.id, titulo: "A1" } });
    await expect(inOrganization(A.id, (tx) => tx.aviso.update({ where: { id: a1.id }, data: { organizationId: B.id } }))).rejects.toThrow();
    const b1 = await prisma.aviso.findFirstOrThrow({ where: { organizationId: B.id } });
    expect(await inOrganization(A.id, (tx) => tx.aviso.deleteMany({ where: { id: b1.id } }))).toEqual({ count: 0 });
    expect(await prisma.aviso.count({ where: { id: b1.id } })).toBe(1);
  });

  it("o histórico de migrations não é do papel de runtime", async () => {
    await expect(app.$queryRaw`SELECT count(*) FROM "_prisma_migrations"`).rejects.toThrow();
  });
});
