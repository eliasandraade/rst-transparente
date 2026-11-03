import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";

const UpdateAvisoSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  corpo: z.string().min(1).optional(),
  fixado: z.boolean().optional(),
  status: z.enum(["RASCUNHO", "PUBLICADO"]).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "avisos.editar")) return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const dados = UpdateAvisoSchema.parse(body);

    const aviso = await db.aviso.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json(aviso);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao atualizar aviso" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "avisos.editar")) return forbidden();

  const { id } = await params;

  try {
    await db.aviso.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir aviso" }, { status: 500 });
  }
}
