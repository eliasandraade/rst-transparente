import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { syncProcesso } from "@/lib/juridico";
import { errorSummary } from "@/lib/privacy";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  const { id } = await params;
  const usuarioId = (session.user as { id?: string })?.id ?? null;

  try {
    const resultado = await syncProcesso(id, usuarioId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro ?? "Falha na sincronização" },
        { status: 502 }
      );
    }

    return NextResponse.json({ sucesso: true, numeroProcesso: resultado.numeroProcesso });
  } catch (err) {
    console.error("[POST /api/juridico/processos/[id]/sync]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao sincronizar processo." }, { status: 500 });
  }
}
