import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyAccessCode, checkRateLimit, getClientIp } from "@/lib/demandas";

const LookupSchema = z.object({
  protocol: z.string().min(1),
  accessCode: z.string().min(1),
});

const INVALID_MSG = "Protocolo ou código inválido. Verifique os dados e tente novamente.";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 1 minuto e tente novamente." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { protocol, accessCode } = LookupSchema.parse(body);

    const demand = await prisma.demand.findUnique({
      where: { protocol: protocol.toUpperCase() },
      include: {
        updates: {
          orderBy: { createdAt: "asc" },
          select: {
            previousStatus: true,
            newStatus: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });

    if (!demand) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 404 });
    }

    const valid = await verifyAccessCode(accessCode, demand.accessCode);
    if (!valid) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 401 });
    }

    // Retornar apenas dados não-pessoais
    return NextResponse.json({
      protocol: demand.protocol,
      status: demand.status,
      category: demand.category,
      title: demand.title,
      description: demand.description,
      attachmentUrl: demand.attachmentUrl,
      attachmentName: demand.attachmentName,
      createdAt: demand.createdAt,
      closedAt: demand.closedAt,
      updates: demand.updates,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
    }
    console.error("[POST /api/demandas/lookup]", err);
    return NextResponse.json({ error: INVALID_MSG }, { status: 500 });
  }
}
