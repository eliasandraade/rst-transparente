import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { attachmentLink } from "@/lib/files";
import { errorSummary } from "@/lib/privacy";
import { z } from "zod";
import { verifyAccessCode, DUMMY_ACCESS_CODE_HASH } from "@/lib/demandas";
import { clientIp } from "@/lib/client-ip";
import { RATE_LIMITS, rateLimit, rateLimitResponseBody } from "@/lib/rate-limit";

const LookupSchema = z.object({
  protocol: z.string().min(1),
  accessCode: z.string().min(1),
});

const INVALID_MSG = "Protocolo ou código inválido. Verifique os dados e tente novamente.";

export async function POST(request: Request) {
  const { org, db } = await requireTenant();
  const limited = await rateLimit(RATE_LIMITS.demandLookup, clientIp(request));
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponseBody(limited), { status: limited.reason === "limited" ? 429 : 503 });
  }

  try {
    const body = await request.json();
    const { protocol, accessCode } = LookupSchema.parse(body);

    const demand = await db.demand.findFirst({
      where: { protocol: protocol.trim().toUpperCase() },
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

    // Protocolo inexistente e código errado respondem igual (status, mensagem e
    // custo): a consulta não revela quais protocolos existem.
    const valid = await verifyAccessCode(accessCode, demand?.accessCode ?? DUMMY_ACCESS_CODE_HASH);
    if (!demand || !valid) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 404 });
    }

    return NextResponse.json({
      protocol: demand.protocol,
      status: demand.status,
      category: demand.category,
      title: demand.title,
      description: demand.description,
      attachmentUrl: attachmentLink(demand.attachmentUrl, org.id),
      attachmentName: demand.attachmentName,
      createdAt: demand.createdAt,
      closedAt: demand.closedAt,
      updates: demand.updates,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
    }
    console.error("[POST /api/demandas/lookup]", errorSummary(err));
    return NextResponse.json({ error: INVALID_MSG }, { status: 500 });
  }
}
