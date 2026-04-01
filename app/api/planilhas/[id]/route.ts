import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteParecer } from "@/lib/cloudinary";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const planilha = await prisma.planilhaDownload.findUnique({ where: { id } });
    if (!planilha) {
      return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 });
    }

    // Extract publicId: last segment of the URL path without extension
    const urlSegments = planilha.arquivoUrl.split("/");
    const lastSegment = urlSegments[urlSegments.length - 1];
    const publicIdWithFolder = urlSegments
      .slice(urlSegments.indexOf("rst-transparente"))
      .join("/")
      .replace(/\.[^/.]+$/, "");

    await deleteParecer(publicIdWithFolder || lastSegment.replace(/\.[^/.]+$/, ""));
    await prisma.planilhaDownload.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir planilha:", err);
    return NextResponse.json({ error: "Erro ao excluir planilha" }, { status: 500 });
  }
}
