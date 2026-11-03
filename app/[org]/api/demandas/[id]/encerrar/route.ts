import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { organizationTransaction, requireTenant } from "@/lib/tenant";
import { z } from "zod";
import { sanitizeText } from "@/lib/demandas";
import { errorSummary } from "@/lib/privacy";

interface Params {
  params: Promise<{ id: string }>;
}

const EncerrarSchema = z.object({
  finalStatus: z.enum(["RESOLVIDA", "ENCERRADA_SEM_ACAO"]),
  message: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request, { params }: Params) {
  const { org } = await requireTenant();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "demandas.atender")) return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const { finalStatus, message } = EncerrarSchema.parse(body);

    const result = await organizationTransaction(org.id, async (tx) => {
      const demand = await tx.demand.findFirst({ where: { id, organizationId: org.id } });
      if (!demand) return { notFound: true as const };

      if (demand.status === "RESOLVIDA" || demand.status === "ENCERRADA_SEM_ACAO") {
        return { alreadyClosed: true as const };
      }

      const encerrarMsg =
        finalStatus === "RESOLVIDA"
          ? "Demanda encerrada como resolvida."
          : "Demanda encerrada sem ação.";

      await tx.demandUpdate.create({
        data: {
          organizationId: org.id,
          demandId: id,
          previousStatus: demand.status,
          newStatus: finalStatus,
          message: message ? sanitizeText(message) : encerrarMsg,
          createdById: session.user.id,
        },
      });

      const updated = await tx.demand.update({
        where: { id, organizationId: org.id },
        data: { status: finalStatus, closedAt: new Date() },
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
    console.error("[POST /api/demandas/[id]/encerrar]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao encerrar demanda." }, { status: 500 });
  }
}
