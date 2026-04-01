import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z.object({
  pergunta: z.string().min(1).max(500).optional(),
  tipo: z.enum(["UNICA", "MULTIPLA"]).optional(),
  status: z.enum(["RASCUNHO", "PUBLICADO"]).optional(),
  dataFim: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const dados = PatchSchema.parse(body);

    const enquete = await prisma.enquete.update({
      where: { id },
      data: {
        ...(dados.pergunta !== undefined && { pergunta: dados.pergunta }),
        ...(dados.tipo !== undefined && { tipo: dados.tipo }),
        ...(dados.status !== undefined && { status: dados.status }),
        ...(dados.dataFim !== undefined && { dataFim: dados.dataFim ? new Date(dados.dataFim) : null }),
      },
    });

    return NextResponse.json(enquete);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar enquete" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.enquete.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir enquete" }, { status: 500 });
  }
}
