import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncProcesso } from "@/lib/juridico";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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
    console.error("[POST /api/juridico/processos/[id]/sync]", err);
    return NextResponse.json({ error: "Erro ao sincronizar processo." }, { status: 500 });
  }
}
