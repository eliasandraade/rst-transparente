import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VotoSchema = z.object({
  opcaoIds: z.array(z.string()).min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: enqueteId } = await params;
    const body = await request.json();
    const { opcaoIds } = VotoSchema.parse(body);

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const enquete = await prisma.enquete.findUnique({
      where: { id: enqueteId },
      select: { id: true, tipo: true, status: true, dataFim: true },
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

    if (enquete.tipo === "UNICA") {
      if (opcaoIds.length !== 1) {
        return NextResponse.json({ error: "Selecione apenas uma opção" }, { status: 400 });
      }

      const jaVotou = await prisma.votoEnquete.findFirst({
        where: { enqueteId, ip },
      });
      if (jaVotou) {
        return NextResponse.json({ error: "Você já votou nesta enquete" }, { status: 409 });
      }

      await prisma.votoEnquete.create({
        data: { enqueteId, opcaoId: opcaoIds[0], ip },
      });
    } else {
      // MULTIPLA — use createMany with skipDuplicates
      await prisma.votoEnquete.createMany({
        data: opcaoIds.map((opcaoId) => ({ enqueteId, opcaoId, ip })),
        skipDuplicates: true,
      });
    }

    const totalVotos = await prisma.votoEnquete.count({ where: { enqueteId } });
    return NextResponse.json({ success: true, totalVotos });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao registrar voto" }, { status: 500 });
  }
}
