import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ObraSchema = z.object({
  titulo: z.string().min(1).max(200),
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

export async function GET() {
  try {
    const session = await auth();

    const obras = await prisma.obra.findMany({
      where: session ? {} : { publicado: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(obras);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar obras" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const dados = ObraSchema.parse(body);

    const obra = await prisma.obra.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        orcamento: dados.orcamento ?? null,
        gasto: dados.gasto ?? null,
        status: dados.status ?? "PLANEJADO",
        progresso: dados.progresso ?? 0,
        dataInicio: dados.dataInicio ? new Date(dados.dataInicio) : null,
        dataPrevista: dados.dataPrevista ? new Date(dados.dataPrevista) : null,
        imagemUrl: dados.imagemUrl ?? null,
        publicado: dados.publicado ?? false,
      },
    });

    return NextResponse.json(obra, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar obra" }, { status: 500 });
  }
}
