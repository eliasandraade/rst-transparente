import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";
import { moneySchema } from "@/lib/money";

const UpdateSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoriaId: z.string().min(1),
  descricao: z.string().min(1).max(200),
  valor: moneySchema({ positive: true }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fornecedor: z.string().max(150).nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "financeiro.editar")) return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const dados = UpdateSchema.parse(body);
    if (!(await db.categoria.findFirst({ where: { id: dados.categoriaId }, select: { id: true } }))) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 400 });
    }

    const lancamento = await db.lancamento.update({
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
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "financeiro.editar")) return forbidden();

  const { id } = await params;

  try {
    await db.lancamento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
