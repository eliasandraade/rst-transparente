import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { RUN, createOrganization, dropOrganizations, prisma, type TestOrganization } from "./context";

/**
 * Contract (migration 20261105000000_contract): o banco garante sozinho, mesmo para
 * quem escreve direto nele (o dono, sem RLS), que todo registro tem organização e
 * que nenhuma referência atravessa organizações.
 */

let A: TestOrganization;
let B: TestOrganization;
let categoriaA: string;
let processoA: string;

beforeAll(async () => {
  A = await createOrganization(`contrato-a-${RUN}`, `KA${RUN.slice(-3)}`);
  B = await createOrganization(`contrato-b-${RUN}`, `KB${RUN.slice(-3)}`);
  categoriaA = (await prisma.categoria.create({ data: { organizationId: A.id, nome: "Taxa", tipo: "RECEITA" } })).id;
  processoA = (await prisma.processo.create({ data: { organizationId: A.id, numeroProcesso: `0000002${RUN.slice(-6)}0000000`.slice(0, 20) } })).id;
});

afterAll(async () => {
  await dropOrganizations([A?.id, B?.id].filter(Boolean));
  await prisma.$disconnect();
});

const lancamento = (organizationId: string | null, categoriaId: string) => ({
  organizationId, tipo: "RECEITA" as const, categoriaId, descricao: "x", valor: "1.00", data: new Date("2099-05-01"), periodo: "2099-05",
});

describe("contract no banco", () => {
  it("registro sem organização é recusado", async () => {
    await expect(prisma.aviso.create({ data: { titulo: "sem organização", corpo: "x" } })).rejects.toThrow();
    await expect(prisma.categoria.create({ data: { organizationId: null, nome: "x", tipo: "DESPESA" } })).rejects.toThrow();
  });

  it("referência a registro de outra organização é recusada, também ao mudar a referência", async () => {
    await expect(prisma.lancamento.create({ data: lancamento(B.id, categoriaA) })).rejects.toThrow(/outra|organiza|foreign/i);
    await expect(
      prisma.multa.create({ data: { organizationId: B.id, processoId: processoA, bloco: "A", unidade: "101", motivo: "x", valor: "1.00", dataAplicacao: new Date() } })
    ).rejects.toThrow();
    await expect(prisma.staffSession.create({
      data: { organizationId: B.id, userId: A.staff.id, authMethod: "PASSWORD", tokenHash: `x-${RUN}`, csrfHash: "x", expiresAt: new Date(Date.now() + 60_000) },
    })).rejects.toThrow();

    const ok = await prisma.lancamento.create({ data: lancamento(A.id, categoriaA) });
    const categoriaB = await prisma.categoria.create({ data: { organizationId: B.id, nome: "Taxa B", tipo: "RECEITA" } });
    await expect(prisma.lancamento.update({ where: { id: ok.id }, data: { categoriaId: categoriaB.id } })).rejects.toThrow();
    await expect(prisma.lancamento.update({ where: { id: ok.id }, data: { organizationId: B.id } })).rejects.toThrow();
    expect((await prisma.lancamento.findUniqueOrThrow({ where: { id: ok.id } })).categoriaId).toBe(categoriaA);
  });

  it("referência nula continua permitida onde o campo é opcional", async () => {
    const multa = await prisma.multa.create({
      data: { organizationId: A.id, processoId: null, bloco: "A", unidade: "101", motivo: "sem processo", valor: "1.00", dataAplicacao: new Date() },
    });
    expect(multa.processoId).toBeNull();
  });

  it("migrations e histórico ficam com o dono: o papel de runtime não cria tabela", async () => {
    if (!process.env.ADMIN_DATABASE_URL) return;
    const app = new PrismaClient();
    await expect(app.$executeRawUnsafe(`CREATE TABLE "nao_deveria_${RUN}" (id int)`)).rejects.toThrow();
    await app.$disconnect();
  });
});
