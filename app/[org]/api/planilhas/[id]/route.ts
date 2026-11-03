import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { deletePublicFile } from "@/lib/files";
import { errorSummary } from "@/lib/privacy";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "planilhas.editar")) return forbidden();

  try {
    const { id } = await params;
    const planilha = await db.planilhaDownload.findUnique({ where: { id } });
    if (!planilha) {
      return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 });
    }

    // public_id = caminho depois de /upload/[v123/], sem a extensão (pasta antiga ou da organização)
    const publicId = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i.exec(new URL(planilha.arquivoUrl).pathname)?.[1];
    if (publicId) await deletePublicFile(decodeURIComponent(publicId));
    await db.planilhaDownload.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir planilha:", errorSummary(err));
    return NextResponse.json({ error: "Erro ao excluir planilha" }, { status: 500 });
  }
}
