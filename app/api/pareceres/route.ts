import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ParecerSchema = z.object({
  periodoRef: z.string().regex(/^\d{4}-\d{2}$/),
  titulo: z.string().min(1).max(200),
  texto: z.string().nullable().optional(),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  membrosConselho: z.string().nullable().optional(),
  arquivoUrl: z.string().url().nullable().optional(),
  arquivoNome: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const dados = ParecerSchema.parse(body);

    const parecer = await prisma.parecer.create({
      data: {
        periodoRef: dados.periodoRef,
        titulo: dados.titulo,
        texto: dados.texto ?? null,
        dataEmissao: new Date(dados.dataEmissao),
        membrosConselho: dados.membrosConselho ?? null,
        arquivoUrl: dados.arquivoUrl ?? null,
        arquivoNome: dados.arquivoNome ?? null,
        status: "RASCUNHO",
      },
    });

    return NextResponse.json(parecer, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar parecer" }, { status: 500 });
  }
}
