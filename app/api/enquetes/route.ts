import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const enquetes = await prisma.enquete.findMany({
      where: { status: "PUBLICADO" },
      include: {
        opcoes: {
          orderBy: { ordem: "asc" },
          include: { votos: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const resultado = enquetes.map((enquete) => {
      const opcoes = enquete.opcoes.map((opcao) => ({
        id: opcao.id,
        texto: opcao.texto,
        ordem: opcao.ordem,
        totalVotos: opcao.votos.length,
      }));
      const totalVotos = opcoes.reduce((acc, o) => acc + o.totalVotos, 0);

      return {
        id: enquete.id,
        pergunta: enquete.pergunta,
        tipo: enquete.tipo,
        dataFim: enquete.dataFim,
        opcoes,
        totalVotos,
      };
    });

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar enquetes" }, { status: 500 });
  }
}

const EnqueteSchema = z.object({
  pergunta: z.string().min(1).max(500),
  tipo: z.enum(["UNICA", "MULTIPLA"]),
  dataFim: z.string().datetime().nullable().optional(),
  opcoes: z.array(z.string().min(1)).min(2).max(8),
  status: z.enum(["RASCUNHO", "PUBLICADO"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const dados = EnqueteSchema.parse(body);

    const enquete = await prisma.enquete.create({
      data: {
        pergunta: dados.pergunta,
        tipo: dados.tipo,
        status: dados.status ?? "RASCUNHO",
        dataFim: dados.dataFim ? new Date(dados.dataFim) : null,
        opcoes: {
          create: dados.opcoes.map((texto, index) => ({
            texto,
            ordem: index,
          })),
        },
      },
      include: { opcoes: true },
    });

    return NextResponse.json(enquete, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", detalhes: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar enquete" }, { status: 500 });
  }
}
