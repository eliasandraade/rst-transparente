import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";
import { moneySchema } from "@/lib/money";

const LancamentoSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoriaId: z.string().min(1),
  descricao: z.string().min(1).max(200),
  valor: moneySchema({ positive: true }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fornecedor: z.string().max(150).nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function GET(request: Request) {
  const db = await tenantDb();
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo");
    // Sem sessão, só o que está publicado: rascunho nunca sai para o público,
    // seja qual for o parâmetro pedido.
    const session = await staffSession();
    const pedido = searchParams.get("status");
    const status = !session ? "PUBLICADO" : pedido === "PUBLICADO" || pedido === "RASCUNHO" ? pedido : null;

    const lancamentos = await db.lancamento.findMany({
      where: {
        ...(periodo ? { periodo } : {}),
        ...(status ? { status } : {}),
      },
      include: { categoria: { select: { id: true, nome: true, cor: true } } },
      orderBy: [{ tipo: "asc" }, { data: "asc" }],
    });

    return NextResponse.json(lancamentos);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar lançamentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "financeiro.editar")) return forbidden();

  try {
    const body = await request.json();
    const dados = LancamentoSchema.parse(body);
    if (!(await db.categoria.findFirst({ where: { id: dados.categoriaId }, select: { id: true } }))) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 400 });
    }

    const lancamento = await db.lancamento.create({
      data: {
        tipo: dados.tipo,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        data: new Date(dados.data),
        fornecedor: dados.fornecedor ?? null,
        observacoes: dados.observacoes ?? null,
        periodo: dados.periodo,
        status: "RASCUNHO",
      },
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar lançamento" }, { status: 500 });
  }
}
