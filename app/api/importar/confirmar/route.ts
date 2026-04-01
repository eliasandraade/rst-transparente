import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  descricao: z.string().min(1),
  valor: z.number().positive(),
  categoriaId: z.string().min(1, "Selecione uma categoria para todos os itens"),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

const bodySchema = z.object({
  itens: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { itens } = parsed.data;

  // Verifica se todas as categorias existem
  const categoriaIds = Array.from(new Set(itens.map((i) => i.categoriaId)));
  const categorias = await prisma.categoria.findMany({
    where: { id: { in: categoriaIds } },
    select: { id: true },
  });
  const idsValidos = new Set(categorias.map((c) => c.id));
  const invalido = categoriaIds.find((id) => !idsValidos.has(id));
  if (invalido) {
    return NextResponse.json(
      { error: `Categoria inválida: ${invalido}` },
      { status: 400 }
    );
  }

  // Cria todos os lançamentos como RASCUNHO
  const lancamentos = await prisma.lancamento.createMany({
    data: itens.map((item) => ({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: item.valor,
      categoriaId: item.categoriaId,
      periodo: item.periodo,
      data: new Date(`${item.periodo}-01`),
      status: "RASCUNHO",
    })),
  });

  return NextResponse.json({ importados: lancamentos.count });
}
