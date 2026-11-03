import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hashAccessCode } from "@/lib/demandas";
import {
  RUN, as, createOrganization, dropOrganizations, flushRateLimits, jsonRequest, params, prisma,
  type TestOrganization,
} from "./context";

vi.mock("next/headers", async () => (await import("./context")).mockHeaders());
// lib/files assina links localmente; sem rede, só uma configuração de teste.
Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: "nuvem-teste", CLOUDINARY_API_KEY: "123", CLOUDINARY_API_SECRET: "segredo-teste" });

/**
 * Rotas reais contra PostgreSQL e Redis reais: consulta de demanda sem oráculo de
 * protocolo, rascunho financeiro nunca público, voto só em opção da própria
 * enquete, valores monetários exatos e rate limit compartilhado no Redis.
 */

let org: TestOrganization;

beforeAll(async () => {
  await flushRateLimits();
  org = await createOrganization(`publico-${RUN}`, `PB${RUN.slice(-3)}`);
});

afterAll(async () => {
  if (org) await dropOrganizations([org.id]);
  await flushRateLimits();
  await prisma.$disconnect();
});

describe("consulta de demanda por protocolo e código", () => {
  it("protocolo inexistente e código errado respondem igual; o certo devolve só o público", async () => {
    const { POST } = await import("@/app/[org]/api/demandas/lookup/route");
    as(org);
    const demand = await prisma.demand.create({
      data: {
        organizationId: org.id,
        protocol: `${org.slug.slice(0, 2).toUpperCase()}-2026-${RUN.slice(-6)}`,
        accessCode: await hashAccessCode("ABC234"),
        requesterName: "Pessoa Teste",
        unit: "A-101",
        phone: "85999990000",
        email: "pessoa@example.test",
        category: "MANUTENCAO",
        title: "Lâmpada queimada",
        description: "Lâmpada do corredor queimada há dias.",
      },
    });

    const missing = await POST(jsonRequest("/api/demandas/lookup", { protocol: "TST-2026-ZZZZZZ", accessCode: "ABC234" }));
    const wrong = await POST(jsonRequest("/api/demandas/lookup", { protocol: demand.protocol, accessCode: "ZZZ999" }));
    expect(missing.status).toBe(404);
    expect(wrong.status).toBe(404);
    expect(await missing.json()).toEqual(await wrong.json());

    const ok = await POST(jsonRequest("/api/demandas/lookup", { protocol: demand.protocol.toLowerCase(), accessCode: "abc234" }));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.protocol).toBe(demand.protocol);
    for (const field of ["id", "requesterName", "unit", "email", "phone", "accessCode", "ipAddress", "userAgent", "organizationId"]) {
      expect(body).not.toHaveProperty(field);
    }
  });

  it("rate limit compartilhado: a partir da 6ª tentativa no minuto, 429", async () => {
    const { POST } = await import("@/app/[org]/api/demandas/lookup/route");
    as(org);
    const ip = "203.0.113.200";
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await POST(jsonRequest("/api/demandas/lookup", { protocol: "TST-2026-AAAAAA", accessCode: "AAAAAA" }, "POST", ip))).status);
    }
    expect(statuses.slice(0, 5).every((status) => status === 404)).toBe(true);
    expect(statuses[5]).toBe(429);
  });

  it("demanda nova recebe o prefixo de protocolo da organização", async () => {
    const { POST } = await import("@/app/[org]/api/demandas/route");
    as(org);
    const res = await POST(jsonRequest("/api/demandas", {
      requesterName: "Pessoa Teste", unit: "B-202", phone: "85999990000", category: "LIMPEZA",
      title: "Corredor sujo", description: "Corredor do bloco B sem limpeza há uma semana.",
    }));
    expect(res.status).toBe(201);
    const { protocol } = (await res.json()) as { protocol: string };
    expect(protocol).toMatch(new RegExp(`^PB${RUN.slice(-3)}-\\d{4}-[A-Z0-9]{6}$`));
    const salva = await prisma.demand.findFirstOrThrow({ where: { protocol }, include: { updates: true } });
    expect(salva.organizationId).toBe(org.id);
    expect(salva.updates.map((update) => update.organizationId)).toEqual([org.id]);
  });
});

describe("financeiro", () => {
  it("sem sessão, ?status=RASCUNHO não devolve rascunho", async () => {
    const { GET } = await import("@/app/[org]/api/lancamentos/route");
    as(org);
    const categoria = await prisma.categoria.create({ data: { organizationId: org.id, nome: `Teste ${RUN}`, tipo: "DESPESA" } });
    const periodo = "2099-01";
    for (const status of ["RASCUNHO", "PUBLICADO"] as const) {
      await prisma.lancamento.create({
        data: { organizationId: org.id, tipo: "DESPESA", categoriaId: categoria.id, descricao: `${status} ${RUN}`, valor: "10.00", data: new Date("2099-01-10"), periodo, status },
      });
    }
    const res = await GET(new Request(`http://cond.test/api/lancamentos?periodo=${periodo}&status=RASCUNHO`));
    const itens = (await res.json()) as { status: string }[];
    expect(itens.length).toBeGreaterThan(0);
    expect(itens.every((item) => item.status === "PUBLICADO")).toBe(true);
  });

  it("valor monetário exato; mais de 2 casas é recusado, não arredondado escondido", async () => {
    const { POST } = await import("@/app/[org]/api/lancamentos/route");
    as(org, org);
    const categoria = await prisma.categoria.create({ data: { organizationId: org.id, nome: `Receita ${RUN}`, tipo: "RECEITA" } });
    const base = { tipo: "RECEITA", categoriaId: categoria.id, descricao: "Taxa", data: "2099-02-10", periodo: "2099-02" };

    const ok = await POST(jsonRequest("/api/lancamentos", { ...base, valor: "1.234,56" }));
    expect(ok.status).toBe(201);
    const criado = await ok.json();
    expect((await prisma.lancamento.findUniqueOrThrow({ where: { id: criado.id } })).valor.toString()).toBe("1234.56");

    expect((await POST(jsonRequest("/api/lancamentos", { ...base, valor: 0.1 + 0.2 }))).status).toBe(400);
  });
});

describe("enquete", () => {
  it("voto só em opção da própria enquete; um voto por IP na enquete de escolha única", async () => {
    const { POST } = await import("@/app/[org]/api/enquetes/[id]/votar/route");
    as(org);
    const opcoes = (textos: string[]) => ({ create: textos.map((texto) => ({ organizationId: org.id, texto })) });
    const a = await prisma.enquete.create({
      data: { organizationId: org.id, pergunta: `A ${RUN}`, status: "PUBLICADO", opcoes: opcoes(["Sim", "Não"]) },
      include: { opcoes: true },
    });
    const b = await prisma.enquete.create({
      data: { organizationId: org.id, pergunta: `B ${RUN}`, status: "PUBLICADO", opcoes: opcoes(["Outra"]) },
      include: { opcoes: true },
    });

    const outra = await POST(jsonRequest(`/api/enquetes/${a.id}/votar`, { opcaoIds: [b.opcoes[0]!.id] }), params({ id: a.id }));
    expect(outra.status).toBe(400);
    expect(await prisma.votoEnquete.count({ where: { enqueteId: a.id } })).toBe(0);

    const ip = "192.0.2.77";
    expect((await POST(jsonRequest(`/api/enquetes/${a.id}/votar`, { opcaoIds: [a.opcoes[0]!.id] }, "POST", ip), params({ id: a.id }))).status).toBe(200);
    expect((await POST(jsonRequest(`/api/enquetes/${a.id}/votar`, { opcaoIds: [a.opcoes[1]!.id] }, "POST", ip), params({ id: a.id }))).status).toBe(409);
    const voto = await prisma.votoEnquete.findFirstOrThrow({ where: { enqueteId: a.id } });
    expect(voto.organizationId).toBe(org.id);
    // IP guardado como pseudônimo da organização, nunca em claro.
    expect(voto.ip.startsWith("h1:")).toBe(true);
    expect(voto.ip).not.toContain(ip);
  });

  it("voto antigo com IP em claro ainda impede repetir", async () => {
    const { POST } = await import("@/app/[org]/api/enquetes/[id]/votar/route");
    as(org);
    const e = await prisma.enquete.create({
      data: { organizationId: org.id, pergunta: `Antiga ${RUN}`, status: "PUBLICADO", opcoes: { create: [{ organizationId: org.id, texto: "Sim" }] } },
      include: { opcoes: true },
    });
    const ip = "192.0.2.91";
    await prisma.votoEnquete.create({ data: { organizationId: org.id, enqueteId: e.id, opcaoId: e.opcoes[0]!.id, ip } });
    expect((await POST(jsonRequest(`/api/enquetes/${e.id}/votar`, { opcaoIds: [e.opcoes[0]!.id] }, "POST", ip), params({ id: e.id }))).status).toBe(409);
  });
});

describe("anexo de demanda", () => {
  const base = {
    requesterName: "Pessoa Teste", unit: "C-303", phone: "85999990000", category: "VAZAMENTO",
    title: "Vazamento na garagem", description: "Vazamento perto da vaga 12 desde ontem.",
  };

  it("referência de outra organização ou URL qualquer é recusada; a própria vira link assinado na consulta", async () => {
    const { POST } = await import("@/app/[org]/api/demandas/route");
    as(org);
    const outra = `cond-file:image:jpg:orken-cond/${"0".repeat(8)}-0000-4000-8000-${"0".repeat(12)}/demandas/1-foto`;
    expect((await POST(jsonRequest("/api/demandas", { ...base, attachmentRef: outra }))).status).toBe(400);
    expect((await POST(jsonRequest("/api/demandas", { ...base, attachmentRef: "https://res.cloudinary.com/x/image/upload/a.jpg" }))).status).toBe(400);

    const propria = `cond-file:image:jpg:orken-cond/${org.id}/demandas/1700000000000-foto`;
    const res = await POST(jsonRequest("/api/demandas", { ...base, attachmentRef: propria, attachmentName: "foto.jpg" }));
    expect(res.status).toBe(201);
    const { protocol, accessCode } = (await res.json()) as { protocol: string; accessCode: string };
    const salva = await prisma.demand.findFirstOrThrow({ where: { protocol } });
    expect(salva.attachmentUrl).toBe(propria);
    expect(salva.ipAddress?.startsWith("h1:")).toBe(true);

    const lookup = await import("@/app/[org]/api/demandas/lookup/route");
    const body = (await (await lookup.POST(jsonRequest("/api/demandas/lookup", { protocol, accessCode }))).json()) as { attachmentUrl: string };
    const link = new URL(body.attachmentUrl);
    expect(link.hostname).toBe("api.cloudinary.com");
    expect(link.searchParams.get("type")).toBe("authenticated");
  });
});
