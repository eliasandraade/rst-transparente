import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { organizationTransaction, requireTenant } from "@/lib/tenant";
import { attachmentLink } from "@/lib/files";
import { z } from "zod";
import { sanitizeText } from "@/lib/demandas";
import { errorSummary } from "@/lib/privacy";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { org, db } = await requireTenant();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "demandas.atender")) return forbidden();

  const { id } = await params;

  try {
    const demand = await db.demand.findUnique({
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

    return NextResponse.json({ ...demand, attachmentUrl: attachmentLink(demand.attachmentUrl, org.id) });
  } catch (err) {
    console.error("[GET /api/demandas/[id]]", errorSummary(err));
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
  const { org } = await requireTenant();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "demandas.atender")) return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const { newStatus, message } = UpdateDemandSchema.parse(body);

    const result = await organizationTransaction(org.id, async (tx) => {
      const demand = await tx.demand.findFirst({ where: { id, organizationId: org.id } });
      if (!demand) return { notFound: true as const };

      if (demand.status === "RESOLVIDA" || demand.status === "ENCERRADA_SEM_ACAO") {
        return { alreadyClosed: true as const };
      }

      const isFinalStatus =
        newStatus === "RESOLVIDA" || newStatus === "ENCERRADA_SEM_ACAO";

      await tx.demandUpdate.create({
        data: {
          organizationId: org.id,
          demandId: id,
          previousStatus: demand.status,
          newStatus,
          message: sanitizeText(message),
          createdById: session.user.id,
        },
      });

      const updated = await tx.demand.update({
        where: { id, organizationId: org.id },
        data: {
          status: newStatus,
          closedAt: isFinalStatus ? new Date() : undefined,
        },
      });

      return { updated };
    });

    if (result.notFound) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }
    if (result.alreadyClosed) {
      return NextResponse.json({ error: "Esta demanda já está encerrada." }, { status: 409 });
    }

    return NextResponse.json(result.updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[PUT /api/demandas/[id]]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao atualizar demanda." }, { status: 500 });
  }
}
