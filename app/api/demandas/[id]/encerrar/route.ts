import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeText } from "@/lib/demandas";

interface Params {
  params: Promise<{ id: string }>;
}

const EncerrarSchema = z.object({
  finalStatus: z.enum(["RESOLVIDA", "ENCERRADA_SEM_ACAO"]),
  message: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { finalStatus, message } = EncerrarSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const demand = await tx.demand.findUnique({ where: { id } });
      if (!demand) return null;

      if (demand.status === "RESOLVIDA" || demand.status === "ENCERRADA_SEM_ACAO") {
        throw Object.assign(new Error("already_closed"), { code: "ALREADY_CLOSED" });
      }

      const encerrarMsg =
        finalStatus === "RESOLVIDA"
          ? "Demanda encerrada como resolvida."
          : "Demanda encerrada sem ação.";

      await tx.demandUpdate.create({
        data: {
          demandId: id,
          previousStatus: demand.status,
          newStatus: finalStatus,
          message: message ? sanitizeText(message) : encerrarMsg,
          createdById: session.user.id,
        },
      });

      return tx.demand.update({
        where: { id },
        data: { status: finalStatus, closedAt: new Date() },
      });
    });

    if (!updated) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && (err as any).code === "ALREADY_CLOSED") {
      return NextResponse.json({ error: "Esta demanda já está encerrada." }, { status: 409 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/demandas/[id]/encerrar]", err);
    return NextResponse.json({ error: "Erro ao encerrar demanda." }, { status: 500 });
  }
}
