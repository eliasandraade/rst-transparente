import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdatePropostaSchema = z.object({
  status: z.enum(["PENDENTE", "ANALISANDO", "RESPONDIDA", "ARQUIVADA"]).optional(),
  resposta: z.string().optional().nullable(),
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
    const dados = UpdatePropostaSchema.parse(body);

    const proposta = await prisma.proposta.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json(proposta);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao atualizar proposta" }, { status: 500 });
  }
}
