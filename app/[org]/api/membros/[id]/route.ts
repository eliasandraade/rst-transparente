import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";

const MembroSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  cargo: z.string().min(1).max(100).optional(),
  descricao: z.string().max(500).optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
  ordem: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "membros.editar")) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();
    const dados = MembroSchema.parse(body);

    const membro = await db.membro.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json(membro);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar membro" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "membros.editar")) return forbidden();

  try {
    const { id } = await params;
    await db.membro.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir membro" }, { status: 500 });
  }
}
