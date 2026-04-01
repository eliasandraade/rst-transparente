import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const LancamentoSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoriaId: z.string().min(1),
  descricao: z.string().min(1).max(200),
  valor: z.number().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fornecedor: z.string().max(150).nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo");
    const status = searchParams.get("status");

    const lancamentos = await prisma.lancamento.findMany({
      where: {
        ...(periodo ? { periodo } : {}),
        ...(status ? { status: status as "PUBLICADO" | "RASCUNHO" } : {}),
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
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const dados = LancamentoSchema.parse(body);

    const lancamento = await prisma.lancamento.create({
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
