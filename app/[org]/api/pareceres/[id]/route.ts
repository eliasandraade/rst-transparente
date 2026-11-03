import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
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
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "pareceres.editar")) return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const dados = UpdateSchema.parse(body);

    const parecer = await db.parecer.update({
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
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "pareceres.editar")) return forbidden();

  const { id } = await params;

  try {
    await db.parecer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir parecer" }, { status: 500 });
  }
}
