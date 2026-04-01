import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES_PERMITIDOS = ["MASTER", "SINDICO"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !ROLES_PERMITIDOS.includes(session.user.role as typeof ROLES_PERMITIDOS[number])) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Não permite alterar o próprio usuário nem um MASTER
  const alvo = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!alvo) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (alvo.role === "MASTER") return NextResponse.json({ error: "Não é possível alterar uma conta MASTER" }, { status: 403 });
  if (id === session.user.id) return NextResponse.json({ error: "Você não pode alterar sua própria conta aqui" }, { status: 403 });

  // SINDICO não pode alterar outro SINDICO
  if (session.user.role === "SINDICO" && alvo.role === "SINDICO") {
    return NextResponse.json({ error: "Sem permissão para alterar este perfil" }, { status: 403 });
  }

  const usuario = await prisma.user.update({
    where: { id },
    data: { ativo: body.ativo },
    select: { id: true, name: true, email: true, role: true, ativo: true },
  });

  return NextResponse.json(usuario);
}
