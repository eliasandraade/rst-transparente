import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (status !== "PUBLICADO" && status !== "RASCUNHO") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    const lancamento = await prisma.lancamento.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(lancamento);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}
