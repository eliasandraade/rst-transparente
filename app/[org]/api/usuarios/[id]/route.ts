import { NextRequest, NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";

const AlterarUsuarioSchema = z.object({ ativo: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "usuarios.gerenciar")) return forbidden();

  const { id } = await params;
  const parsed = AlterarUsuarioSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Não permite alterar o próprio usuário nem um MASTER
  const alvo = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!alvo) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (alvo.role === "MASTER") return NextResponse.json({ error: "Não é possível alterar uma conta MASTER" }, { status: 403 });
  if (id === session.user.id) return NextResponse.json({ error: "Você não pode alterar sua própria conta aqui" }, { status: 403 });

  // SINDICO não pode alterar outro SINDICO
  if (session.user.role === "SINDICO" && alvo.role === "SINDICO") {
    return NextResponse.json({ error: "Sem permissão para alterar este perfil" }, { status: 403 });
  }

  const usuario = await db.user.update({
    where: { id },
    data: { ativo: parsed.data.ativo },
    select: { id: true, name: true, email: true, role: true, ativo: true },
  });

  return NextResponse.json(usuario);
}
