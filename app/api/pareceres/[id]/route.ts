import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  periodoRef: z.string().regex(/^\d{4}-\d{2}$/),
  titulo: z.string().min(1).max(200),
  texto: z.string().nullable().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  membrosConselho: z.string().nullable().optional(),
  arquivoUrl: z.string().nullable().optional(),
  arquivoNome: z.string().nullable().optional(),
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

    const parecer = await prisma.parecer.update({
      where: { id },
      data: {
        periodoRef: dados.periodoRef,
        titulo: dados.titulo,
        texto: dados.texto ?? null,
        dataEmissao: new Date(dados.dataEmissao),
        membrosConselho: dados.membrosConselho ?? null,
        arquivoUrl: dados.arquivoUrl ?? null,
        arquivoNome: dados.arquivoNome ?? null,
      },
    });

    return NextResponse.json(parecer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar parecer" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.parecer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir parecer" }, { status: 500 });
  }
}
