import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { pseudonymizeIp } from "@/lib/privacy";
import { z } from "zod";
import { clientIp } from "@/lib/client-ip";
import { RATE_LIMITS, rateLimit, rateLimitResponseBody } from "@/lib/rate-limit";

const VotoSchema = z.object({
  opcaoIds: z.array(z.string().max(40)).min(1).max(50),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Um voto por IP é a regra atual de participação (docs/orken-cond/arquitetura.md);
  // o IP precisa ser o real (cabeçalho confiável), nunca o que o cliente escreve.
  const { org, db } = await requireTenant();
  const realIp = clientIp(request);
  // Guardado como pseudônimo por organização (lib/privacy.ts); o IP em claro só vale aqui.
  const ip = pseudonymizeIp(org.id, realIp);
  const limited = await rateLimit(RATE_LIMITS.pollVote, realIp);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponseBody(limited), { status: limited.reason === "limited" ? 429 : 503 });
  }
  try {
    const { id: enqueteId } = await params;
    const body = await request.json();
    const { opcaoIds: recebidas } = VotoSchema.parse(body);
    const opcaoIds = [...new Set(recebidas)];

    const enquete = await db.enquete.findUnique({
      where: { id: enqueteId },
      select: { id: true, tipo: true, status: true, dataFim: true, opcoes: { select: { id: true } } },
    });

    if (!enquete) {
      return NextResponse.json({ error: "Enquete não encontrada" }, { status: 404 });
    }
    if (enquete.status !== "PUBLICADO") {
      return NextResponse.json({ error: "Enquete não está publicada" }, { status: 400 });
    }
    if (enquete.dataFim && new Date() > enquete.dataFim) {
      return NextResponse.json({ error: "Enquete encerrada" }, { status: 400 });
    }
    // Só opções desta enquete: uma opção de outra enquete corromperia a contagem.
    const validas = new Set(enquete.opcoes.map((opcao) => opcao.id));
    if (!opcaoIds.every((opcaoId) => validas.has(opcaoId))) {
      return NextResponse.json({ error: "Opção inválida" }, { status: 400 });
    }

    if (enquete.tipo === "UNICA") {
      if (opcaoIds.length !== 1) {
        return NextResponse.json({ error: "Selecione apenas uma opção" }, { status: 400 });
      }

      // Votos anteriores à pseudonimização guardam o IP em claro.
      const jaVotou = await db.votoEnquete.findFirst({
        where: { enqueteId, ip: { in: [ip, realIp] } },
      });
      if (jaVotou) {
        return NextResponse.json({ error: "Você já votou nesta enquete" }, { status: 409 });
      }

      await db.votoEnquete.create({
        data: { enqueteId, opcaoId: opcaoIds[0], ip },
      });
    } else {
      // MULTIPLA — use createMany with skipDuplicates
      await db.votoEnquete.createMany({
        data: opcaoIds.map((opcaoId) => ({ enqueteId, opcaoId, ip })),
        skipDuplicates: true,
      });
    }

    const totalVotos = await db.votoEnquete.count({ where: { enqueteId } });
    return NextResponse.json({ success: true, totalVotos });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao registrar voto" }, { status: 500 });
  }
}
