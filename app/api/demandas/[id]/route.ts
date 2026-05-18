import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeText } from "@/lib/demandas";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        updates: {
          orderBy: { createdAt: "asc" },
          include: { createdBy: { select: { name: true, role: true } } },
        },
      },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }

    return NextResponse.json(demand);
  } catch (err) {
    console.error("[GET /api/demandas/[id]]", err);
    return NextResponse.json({ error: "Erro ao buscar demanda." }, { status: 500 });
  }
}

const UpdateDemandSchema = z.object({
  newStatus: z.enum([
    "RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ENCERRADA_SEM_ACAO",
  ]),
  message: z.string().min(3, "Escreva uma mensagem de atualização").max(1000),
});

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { newStatus, message } = UpdateDemandSchema.parse(body);

    const demand = await prisma.demand.findUnique({ where: { id } });
    if (!demand) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }

    const isFinalStatus =
      newStatus === "RESOLVIDA" || newStatus === "ENCERRADA_SEM_ACAO";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.demandUpdate.create({
        data: {
          demandId: id,
          previousStatus: demand.status,
          newStatus,
          message: sanitizeText(message),
          createdById: session.user.id,
        },
      });

      return tx.demand.update({
        where: { id },
        data: {
          status: newStatus,
          closedAt: isFinalStatus ? new Date() : undefined,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[PUT /api/demandas/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar demanda." }, { status: 500 });
  }
}
