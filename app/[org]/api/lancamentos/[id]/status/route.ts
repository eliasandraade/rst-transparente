import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "financeiro.editar")) return forbidden();

  const { id } = await params;
  const { status } = await request.json();

  if (status !== "PUBLICADO" && status !== "RASCUNHO") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    const lancamento = await db.lancamento.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(lancamento);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}
