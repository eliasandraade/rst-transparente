import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { syncTodosProcessos } from "@/lib/juridico";

export async function POST() {
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  const usuarioId = (session.user as { id?: string })?.id ?? null;

  try {
    const resultado = await syncTodosProcessos(usuarioId);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[POST /api/juridico/sync]", err);
    return NextResponse.json({ error: "Erro ao sincronizar processos." }, { status: 500 });
  }
}
