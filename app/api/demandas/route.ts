import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { DemandStatus, DemandCategory } from "@prisma/client";

const VALID_STATUSES = ["RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ENCERRADA_SEM_ACAO"] as const;
const VALID_CATEGORIES = ["MANUTENCAO", "SEGURANCA", "LIMPEZA", "FINANCEIRO", "BARULHO", "ILUMINACAO", "VAZAMENTO", "SUGESTAO", "RECLAMACAO", "OUTROS"] as const;
import {
  generateProtocol,
  generateCode,
  hashAccessCode,
  sanitizeText,
  getClientIp,
} from "@/lib/demandas";

const CreateDemandSchema = z.object({
  requesterName: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(100),
  unit: z.string().min(1, "Informe a unidade/apartamento").max(50),
  phone: z.string().min(8, "Telefone inválido").max(20),
  email: z.string().email("E-mail inválido").optional().nullable(),
  category: z.enum([
    "MANUTENCAO", "SEGURANCA", "LIMPEZA", "FINANCEIRO", "BARULHO",
    "ILUMINACAO", "VAZAMENTO", "SUGESTAO", "RECLAMACAO", "OUTROS",
  ]),
  title: z.string().min(5, "Título muito curto").max(120),
  description: z.string().min(10, "Descrição muito curta").max(2000),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateDemandSchema.parse(body);

    const year = new Date().getFullYear();
    const plainAccessCode = generateCode(6);
    const hashedAccessCode = await hashAccessCode(plainAccessCode);

    // Gerar protocolo único com retry (até 5 tentativas em caso de colisão)
    let protocol = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateProtocol(year);
      const exists = await prisma.demand.findUnique({
        where: { protocol: candidate },
      });
      if (!exists) {
        protocol = candidate;
        break;
      }
    }
    if (!protocol) {
      return NextResponse.json(
        { error: "Erro ao gerar protocolo. Tente novamente." },
        { status: 500 }
      );
    }

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const demand = await prisma.$transaction(async (tx) => {
      const created = await tx.demand.create({
        data: {
          protocol,
          accessCode: hashedAccessCode,
          requesterName: sanitizeText(data.requesterName),
          unit: sanitizeText(data.unit),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
          category: data.category,
          title: sanitizeText(data.title),
          description: sanitizeText(data.description),
          attachmentUrl: data.attachmentUrl || null,
          attachmentName: data.attachmentName || null,
          ipAddress,
          userAgent,
        },
      });

      await tx.demandUpdate.create({
        data: {
          demandId: created.id,
          previousStatus: null,
          newStatus: "RECEBIDA",
          message: "Demanda registrada.",
          createdById: null,
        },
      });

      return created;
    });

    return NextResponse.json(
      { protocol: demand.protocol, accessCode: plainAccessCode },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[POST /api/demandas]", err);
    return NextResponse.json(
      { error: "Erro ao registrar demanda." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const rawCategory = searchParams.get("category");
  const search = searchParams.get("search") || undefined;

  const status = rawStatus && VALID_STATUSES.includes(rawStatus as DemandStatus)
    ? (rawStatus as DemandStatus)
    : undefined;
  const category = rawCategory && VALID_CATEGORIES.includes(rawCategory as DemandCategory)
    ? (rawCategory as DemandCategory)
    : undefined;

  try {
    const demands = await prisma.demand.findMany({
      where: {
        ...(status ? { status: status as DemandStatus } : {}),
        ...(category ? { category: category as DemandCategory } : {}),
        ...(search
          ? {
              OR: [
                { protocol: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(demands);
  } catch (err) {
    console.error("[GET /api/demandas]", err);
    return NextResponse.json(
      { error: "Erro ao buscar demandas." },
      { status: 500 }
    );
  }
}
