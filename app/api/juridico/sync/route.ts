import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncTodosProcessos } from "@/lib/juridico";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const usuarioId = (session.user as { id?: string })?.id ?? null;

  try {
    const resultado = await syncTodosProcessos(usuarioId);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[POST /api/juridico/sync]", err);
    return NextResponse.json({ error: "Erro ao sincronizar processos." }, { status: 500 });
  }
}
