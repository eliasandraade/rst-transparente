import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PropostaSchema = z.object({
  texto: z.string().min(10, "O texto deve ter no mínimo 10 caracteres").max(1000, "O texto deve ter no máximo 1000 caracteres"),
  nome: z.string().max(100).optional().nullable(),
  unidade: z.string().max(20).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const propostas = await prisma.proposta.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(propostas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar propostas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dados = PropostaSchema.parse(body);

    const proposta = await prisma.proposta.create({
      data: {
        texto: dados.texto,
        nome: dados.nome?.trim() || null,
        unidade: dados.unidade?.trim() || null,
        status: "PENDENTE",
      },
    });

    return NextResponse.json(proposta, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao enviar proposta" }, { status: 500 });
  }
}
