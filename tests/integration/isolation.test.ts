import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hashAccessCode } from "@/lib/demandas";
import {
  RUN, as, createOrganization, dropOrganizations, flushRateLimits, jsonRequest, params, prisma,
  type TestOrganization,
} from "./context";

vi.mock("next/headers", async () => {
  const { ctx } = await import("./context");
  return { headers: async () => new Headers(ctx.org ? { "x-cond-organization": ctx.org } : {}) };
});
vi.mock("@/lib/auth", async () => {
  const { ctx } = await import("./context");
  return { auth: async () => ctx.session };
});

/**
 * Dois condomínios sintéticos (só em banco de teste): nada de um aparece, muda ou
 * é referenciado a partir do outro, por nenhuma rota, com ou sem sessão.
 */

let A: TestOrganization;
let B: TestOrganization;
const a = {} as {
  categoria: string; lancamento: string; rascunho: string; aviso: string; demand: string; protocol: string;
  enquete: string; opcao: string; processo: string; proposta: string;
};

beforeAll(async () => {
  await flushRateLimits();
  A = await createOrganization(`condominio-a-${RUN}`, `CA${RUN.slice(-3)}`);
  B = await createOrganization(`condominio-b-${RUN}`, `CB${RUN.slice(-3)}`);

  const org = { organizationId: A.id };
  const categoria = await prisma.categoria.create({ data: { ...org, nome: "Taxa", tipo: "RECEITA" } });
  const base = { ...org, tipo: "RECEITA" as const, categoriaId: categoria.id, data: new Date("2099-03-10"), periodo: "2099-03" };
  const lancamento = await prisma.lancamento.create({ data: { ...base, descricao: "Publicado A", valor: "100.00", status: "PUBLICADO" } });
  const rascunho = await prisma.lancamento.create({ data: { ...base, descricao: "Rascunho A", valor: "5.00", status: "RASCUNHO" } });
  const aviso = await prisma.aviso.create({ data: { ...org, titulo: "Aviso A", corpo: "Só do A", status: "PUBLICADO" } });
  const protocol = `CA${RUN.slice(-3)}-2099-AAAAAA`;
  const demand = await prisma.demand.create({
    data: {
      ...org, protocol, accessCode: await hashAccessCode("ABC234"), requesterName: "Pessoa A", unit: "A-101",
      phone: "85999990000", category: "MANUTENCAO", title: "Demanda do A", description: "Descrição da demanda do A.",
    },
  });
  const enquete = await prisma.enquete.create({
    data: { ...org, pergunta: "Enquete A", status: "PUBLICADO", opcoes: { create: [{ ...org, texto: "Sim" }] } },
    include: { opcoes: true },
  });
  const processo = await prisma.processo.create({
    data: { ...org, numeroProcesso: `0000001${RUN.slice(-6)}0000000`.slice(0, 20), resumoPublico: "Processo do A" },
  });
  const proposta = await prisma.proposta.create({ data: { ...org, texto: "Proposta do A" } });
  Object.assign(a, {
    categoria: categoria.id, lancamento: lancamento.id, rascunho: rascunho.id, aviso: aviso.id, demand: demand.id,
    protocol, enquete: enquete.id, opcao: enquete.opcoes[0]!.id, processo: processo.id, proposta: proposta.id,
  });
});

afterAll(async () => {
  await dropOrganizations([A.id, B.id].filter(Boolean));
  await flushRateLimits();
  await prisma.$disconnect();
});

describe("organização da requisição", () => {
  it("inexistente ou desativada responde 404, nunca outra organização", async () => {
    const { GET } = await import("@/app/[org]/api/avisos/route");
    as(`nao-existe-${RUN}`);
    await expect(GET()).rejects.toMatchObject({ digest: expect.stringContaining("404") });

    const off = await createOrganization(`desativada-${RUN}`, `OF${RUN.slice(-3)}`);
    await prisma.organization.update({ where: { id: off.id }, data: { status: "DISABLED" } });
    as(off);
    await expect(GET()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    await dropOrganizations([off.id]);
  });

  it("sem organização no caminho (cabeçalho ausente), 404", async () => {
    const { GET } = await import("@/app/[org]/api/avisos/route");
    as(null);
    await expect(GET()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});

describe("leituras públicas", () => {
  it("financeiro de B não mostra lançamentos de A", async () => {
    const { GET } = await import("@/app/[org]/api/lancamentos/route");
    as(B);
    const itens = (await (await GET(new Request("http://cond.test/api/lancamentos?periodo=2099-03"))).json()) as unknown[];
    expect(itens).toEqual([]);
    as(A);
    const deA = (await (await GET(new Request("http://cond.test/api/lancamentos?periodo=2099-03"))).json()) as { id: string }[];
    expect(deA.map((item) => item.id)).toEqual([a.lancamento]);
  });

  it("avisos, jurídico e propostas de A não aparecem em B", async () => {
    as(B);
    const avisos = await (await (await import("@/app/[org]/api/avisos/route")).GET()).json();
    expect(JSON.stringify(avisos)).not.toContain(a.aviso);
    const juridico = await (await (await import("@/app/[org]/api/juridico/public/route")).GET()).json();
    expect(JSON.stringify(juridico)).not.toContain("Processo do A");
    as(B, B);
    const propostas = await (await (await import("@/app/[org]/api/propostas/route")).GET()).json();
    expect(JSON.stringify(propostas)).not.toContain(a.proposta);
  });

  it("protocolo e código de A não abrem demanda em B; em A abrem", async () => {
    const { POST } = await import("@/app/[org]/api/demandas/lookup/route");
    const body = { protocol: a.protocol, accessCode: "ABC234" };
    as(B);
    expect((await POST(jsonRequest("/api/demandas/lookup", body))).status).toBe(404);
    as(A);
    expect((await POST(jsonRequest("/api/demandas/lookup", body))).status).toBe(200);
  });

  it("voto em B na enquete de A não existe", async () => {
    const { POST } = await import("@/app/[org]/api/enquetes/[id]/votar/route");
    as(B);
    const res = await POST(jsonRequest(`/api/enquetes/${a.enquete}/votar`, { opcaoIds: [a.opcao] }), params({ id: a.enquete }));
    expect(res.status).toBe(404);
    expect(await prisma.votoEnquete.count({ where: { enqueteId: a.enquete } })).toBe(0);
  });
});

describe("equipe", () => {
  it("conta desativada perde o acesso na hora, com o token ainda válido", async () => {
    const { GET } = await import("@/app/[org]/api/propostas/route");
    as(B, B);
    expect((await GET()).status).toBe(200);
    await prisma.user.update({ where: { id: B.staff.id }, data: { ativo: false } });
    expect((await GET()).status).toBe(401);
    await prisma.user.update({ where: { id: B.staff.id }, data: { ativo: true } });
  });

  it("sessão aberta em A não vale em B", async () => {
    const { GET } = await import("@/app/[org]/api/propostas/route");
    as(B, A);
    expect((await GET()).status).toBe(401);
  });

  it("equipe de B não lê, altera nem apaga registros de A pelo id", async () => {
    as(B, B);
    const demandas = await import("@/app/[org]/api/demandas/[id]/route");
    expect((await demandas.GET(new Request("http://cond.test"), params({ id: a.demand }))).status).toBe(404);
    const put = await demandas.PUT(jsonRequest(`/api/demandas/${a.demand}`, { newStatus: "EM_ANALISE", message: "tentativa" }, "PUT"), params({ id: a.demand }));
    expect(put.status).toBe(404);

    const avisos = await import("@/app/[org]/api/avisos/[id]/route");
    const patch = await avisos.PATCH(jsonRequest(`/api/avisos/${a.aviso}`, { titulo: "Alterado por B" }, "PATCH"), params({ id: a.aviso }));
    expect(patch.ok).toBe(false);
    expect((await avisos.DELETE(new Request("http://cond.test"), params({ id: a.aviso }))).ok).toBe(false);

    const lancamentos = await import("@/app/[org]/api/lancamentos/[id]/route");
    const alterar = await lancamentos.PUT(
      jsonRequest(`/api/lancamentos/${a.rascunho}`, { tipo: "RECEITA", categoriaId: a.categoria, descricao: "x", valor: "1,00", data: "2099-03-10", periodo: "2099-03" }, "PUT"),
      params({ id: a.rascunho })
    );
    expect(alterar.ok).toBe(false);

    expect((await prisma.aviso.findUniqueOrThrow({ where: { id: a.aviso } })).titulo).toBe("Aviso A");
    expect((await prisma.demand.findUniqueOrThrow({ where: { id: a.demand } })).status).toBe("RECEBIDA");
    expect((await prisma.lancamento.findUniqueOrThrow({ where: { id: a.rascunho } })).descricao).toBe("Rascunho A");
  });

  it("registro de B não aponta para categoria ou processo de A", async () => {
    as(B, B);
    const { POST } = await import("@/app/[org]/api/lancamentos/route");
    const lanc = await POST(jsonRequest("/api/lancamentos", { tipo: "RECEITA", categoriaId: a.categoria, descricao: "x", valor: "1,00", data: "2099-03-10", periodo: "2099-03" }));
    expect(lanc.status).toBe(400);

    const multas = await import("@/app/[org]/api/juridico/multas/route");
    const multa = await multas.POST(jsonRequest("/api/juridico/multas", {
      processoId: a.processo, bloco: "A", unidade: "101", motivo: "Barulho", valor: "100,00", dataAplicacao: "2099-03-10",
    }));
    expect(multa.status).toBe(400);
    expect(await prisma.multa.count({ where: { organizationId: B.id } })).toBe(0);
  });

  it("escrita de B nasce em B, mesmo pedindo outra organização no corpo", async () => {
    as(B, B);
    const { POST } = await import("@/app/[org]/api/avisos/route");
    const res = await POST(jsonRequest("/api/avisos", { titulo: "Aviso B", corpo: "Só do B", organizationId: A.id }));
    expect(res.status).toBe(201);
    const criado = (await res.json()) as { id: string };
    expect((await prisma.aviso.findUniqueOrThrow({ where: { id: criado.id } })).organizationId).toBe(B.id);
  });

  it("configuração do portal é uma por organização", async () => {
    const { PATCH } = await import("@/app/[org]/api/configuracoes/route");
    await prisma.user.update({ where: { id: B.staff.id }, data: { role: "MASTER" } });
    B.staff.role = "MASTER";
    as(B, B);
    expect((await PATCH(jsonRequest("/api/configuracoes", { nomeCondominio: "Nome do B" }, "PATCH") as never)).status).toBe(200);
    await prisma.user.update({ where: { id: A.staff.id }, data: { role: "MASTER" } });
    A.staff.role = "MASTER";
    as(A, A);
    expect((await PATCH(jsonRequest("/api/configuracoes", { nomeCondominio: "Nome do A" }, "PATCH") as never)).status).toBe(200);
    const configs = await prisma.configPortal.findMany({ where: { organizationId: { in: [A.id, B.id] } } });
    expect(configs.map((c) => [c.organizationId, c.nomeCondominio]).sort()).toEqual(
      [[A.id, "Nome do A"], [B.id, "Nome do B"]].sort()
    );
  });

  it("mesmo e-mail e mesmo protocolo podem existir em organizações diferentes", async () => {
    await prisma.user.create({ data: { organizationId: B.id, email: A.staff.email, name: "Homônimo", password: "x", role: "GESTAO" } });
    await prisma.demand.create({
      data: {
        organizationId: B.id, protocol: a.protocol, accessCode: "x", requesterName: "B", unit: "1", phone: "85",
        category: "OUTROS", title: "Demanda do B", description: "Mesmo protocolo, outro condomínio.",
      },
    });
    await expect(
      prisma.user.create({ data: { organizationId: B.id, email: A.staff.email, name: "Duplicado", password: "x", role: "GESTAO" } })
    ).rejects.toThrow();
  });
});
