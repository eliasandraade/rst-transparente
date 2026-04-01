import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MembroSchema = z.object({
  nome: z.string().min(1).max(100),
  cargo: z.string().min(1).max(100),
  descricao: z.string().max(500).optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
  ordem: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    const membros = await prisma.membro.findMany({
      where: session ? {} : { ativo: true },
      orderBy: { ordem: "asc" },
    });
    return NextResponse.json(membros);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar membros" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const dados = MembroSchema.parse(body);

    const membro = await prisma.membro.create({
      data: {
        nome: dados.nome,
        cargo: dados.cargo,
        descricao: dados.descricao ?? null,
        fotoUrl: dados.fotoUrl ?? null,
        ordem: dados.ordem ?? 0,
        ativo: dados.ativo ?? true,
      },
    });

    return NextResponse.json(membro, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar membro" }, { status: 500 });
  }
}
