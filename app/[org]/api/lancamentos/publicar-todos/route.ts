import { NextRequest, NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function PATCH(req: NextRequest) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!can(session, "financeiro.editar")) return forbidden();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const result = await db.lancamento.updateMany({
    where: { periodo: parsed.data.periodo, status: "RASCUNHO" },
    data: { status: "PUBLICADO" },
  });

  return NextResponse.json({ publicados: result.count });
}
