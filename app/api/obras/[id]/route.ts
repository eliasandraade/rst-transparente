import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateObraSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descricao: z.string().optional().nullable(),
  orcamento: z.number().positive().optional().nullable(),
  gasto: z.number().nonnegative().optional().nullable(),
  status: z.enum(["PLANEJADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"]).optional(),
  progresso: z.number().int().min(0).max(100).optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  dataPrevista: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  imagemUrl: z.string().url().optional().nullable(),
  publicado: z.boolean().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const dados = UpdateObraSchema.parse(body);

    const obra = await prisma.obra.update({
      where: { id },
      data: {
        ...dados,
        dataInicio: dados.dataInicio !== undefined
          ? dados.dataInicio ? new Date(dados.dataInicio) : null
          : undefined,
        dataPrevista: dados.dataPrevista !== undefined
          ? dados.dataPrevista ? new Date(dados.dataPrevista) : null
          : undefined,
      },
    });

    return NextResponse.json(obra);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao atualizar obra" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.obra.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir obra" }, { status: 500 });
  }
}
