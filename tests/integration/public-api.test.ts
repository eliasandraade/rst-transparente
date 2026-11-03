import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { hashAccessCode } from "@/lib/demandas";

/**
 * Rotas reais contra PostgreSQL e Redis reais: consulta de demanda sem oráculo de
 * protocolo, rascunho financeiro nunca público, voto só em opção da própria
 * enquete, valores monetários exatos e rate limit compartilhado no Redis.
 */

const session = vi.hoisted(() => ({ current: null as null | { user: { id: string; role: string } } }));
vi.mock("@/lib/auth", () => ({ auth: async () => session.current }));

const prisma = new PrismaClient();
const RUN = `${Date.now()}`.slice(-8);
const created = { demands: [] as string[], lancamentos: [] as string[], categorias: [] as string[], enquetes: [] as string[] };
let ipCounter = 0;
const nextIp = () => `198.51.100.${(ipCounter++ % 250) + 1}`;

function json(url: string, body: unknown, ip = nextIp()): Request {
  return new Request(`http://cond.test${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

async function flushRateLimits(): Promise<void> {
  if (!process.env.REDIS_URL) return;
  const redis = new Redis(process.env.REDIS_URL);
  const keys = await redis.keys("cond:ratelimit:*");
  if (keys.length) await redis.del(...keys);
  redis.disconnect();
}

beforeAll(async () => {
  await prisma.$connect();
  await flushRateLimits();
});

beforeEach(() => {
  session.current = null;
});

afterAll(async () => {
  await prisma.demand.deleteMany({ where: { id: { in: created.demands } } });
  await prisma.lancamento.deleteMany({ where: { id: { in: created.lancamentos } } });
  await prisma.categoria.deleteMany({ where: { id: { in: created.categorias } } });
  await prisma.enquete.deleteMany({ where: { id: { in: created.enquetes } } });
  await flushRateLimits();
  await prisma.$disconnect();
});

describe("consulta de demanda por protocolo e código", () => {
  it("protocolo inexistente e código errado respondem igual; o certo devolve só o público", async () => {
    const { POST } = await import("@/app/api/demandas/lookup/route");
    const demand = await prisma.demand.create({
      data: {
        protocol: `TST-2026-${RUN.slice(-6)}`,
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
    created.demands.push(demand.id);

    const missing = await POST(json("/api/demandas/lookup", { protocol: "TST-2026-ZZZZZZ", accessCode: "ABC234" }));
    const wrong = await POST(json("/api/demandas/lookup", { protocol: demand.protocol, accessCode: "ZZZ999" }));
    expect(missing.status).toBe(404);
    expect(wrong.status).toBe(404);
    expect(await missing.json()).toEqual(await wrong.json());

    const ok = await POST(json("/api/demandas/lookup", { protocol: demand.protocol.toLowerCase(), accessCode: "abc234" }));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.protocol).toBe(demand.protocol);
    for (const field of ["id", "requesterName", "unit", "email", "phone", "accessCode", "ipAddress", "userAgent"]) {
      expect(body).not.toHaveProperty(field);
    }
  });

  it("rate limit compartilhado: a partir da 6ª tentativa no minuto, 429", async () => {
    const { POST } = await import("@/app/api/demandas/lookup/route");
    const ip = "203.0.113.200";
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await POST(json("/api/demandas/lookup", { protocol: "TST-2026-AAAAAA", accessCode: "AAAAAA" }, ip))).status);
    }
    expect(statuses.slice(0, 5).every((status) => status === 404)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});

describe("financeiro", () => {
  it("sem sessão, ?status=RASCUNHO não devolve rascunho", async () => {
    const { GET } = await import("@/app/api/lancamentos/route");
    const categoria = await prisma.categoria.create({ data: { nome: `Teste ${RUN}`, tipo: "DESPESA" } });
    created.categorias.push(categoria.id);
    const periodo = "2099-01";
    for (const status of ["RASCUNHO", "PUBLICADO"] as const) {
      const lancamento = await prisma.lancamento.create({
        data: { tipo: "DESPESA", categoriaId: categoria.id, descricao: `${status} ${RUN}`, valor: "10.00", data: new Date("2099-01-10"), periodo, status },
      });
      created.lancamentos.push(lancamento.id);
    }
    const res = await GET(new Request(`http://cond.test/api/lancamentos?periodo=${periodo}&status=RASCUNHO`));
    const itens = (await res.json()) as { status: string }[];
    expect(itens.length).toBeGreaterThan(0);
    expect(itens.every((item) => item.status === "PUBLICADO")).toBe(true);
  });

  it("valor monetário exato; mais de 2 casas é recusado, não arredondado escondido", async () => {
    const { POST } = await import("@/app/api/lancamentos/route");
    session.current = { user: { id: "admin-teste", role: "GESTAO" } };
    const categoria = await prisma.categoria.create({ data: { nome: `Receita ${RUN}`, tipo: "RECEITA" } });
    created.categorias.push(categoria.id);
    const base = { tipo: "RECEITA", categoriaId: categoria.id, descricao: "Taxa", data: "2099-02-10", periodo: "2099-02" };

    const ok = await POST(json("/api/lancamentos", { ...base, valor: "1.234,56" }));
    expect(ok.status).toBe(201);
    const criado = await ok.json();
    created.lancamentos.push(criado.id);
    expect((await prisma.lancamento.findUniqueOrThrow({ where: { id: criado.id } })).valor.toString()).toBe("1234.56");

    expect((await POST(json("/api/lancamentos", { ...base, valor: 0.1 + 0.2 }))).status).toBe(400);
  });
});

describe("enquete", () => {
  it("voto só em opção da própria enquete; um voto por IP na enquete de escolha única", async () => {
    const { POST } = await import("@/app/api/enquetes/[id]/votar/route");
    const a = await prisma.enquete.create({
      data: { pergunta: `A ${RUN}`, status: "PUBLICADO", opcoes: { create: [{ texto: "Sim" }, { texto: "Não" }] } },
      include: { opcoes: true },
    });
    const b = await prisma.enquete.create({
      data: { pergunta: `B ${RUN}`, status: "PUBLICADO", opcoes: { create: [{ texto: "Outra" }] } },
      include: { opcoes: true },
    });
    created.enquetes.push(a.id, b.id);
    const params = { params: Promise.resolve({ id: a.id }) };

    const outra = await POST(json(`/api/enquetes/${a.id}/votar`, { opcaoIds: [b.opcoes[0]!.id] }), params);
    expect(outra.status).toBe(400);
    expect(await prisma.votoEnquete.count({ where: { enqueteId: a.id } })).toBe(0);

    const ip = "192.0.2.77";
    expect((await POST(json(`/api/enquetes/${a.id}/votar`, { opcaoIds: [a.opcoes[0]!.id] }, ip), params)).status).toBe(200);
    expect((await POST(json(`/api/enquetes/${a.id}/votar`, { opcaoIds: [a.opcoes[1]!.id] }, ip), params)).status).toBe(409);
  });
});
