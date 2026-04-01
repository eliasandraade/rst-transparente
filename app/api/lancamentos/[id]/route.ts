import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoriaId: z.string().min(1),
  descricao: z.string().min(1).max(200),
  valor: z.number().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fornecedor: z.string().max(150).nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const dados = UpdateSchema.parse(body);

    const lancamento = await prisma.lancamento.update({
      where: { id },
      data: {
        tipo: dados.tipo,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        data: new Date(dados.data),
        fornecedor: dados.fornecedor ?? null,
        observacoes: dados.observacoes ?? null,
        periodo: dados.periodo,
      },
    });

    return NextResponse.json(lancamento);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.lancamento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
