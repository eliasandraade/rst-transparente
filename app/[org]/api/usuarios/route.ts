import { NextRequest, NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Roles que cada perfil pode criar
const ROLES_CRIÁVEIS: Record<string, string[]> = {
  MASTER: ["SINDICO", "GESTAO", "CONSELHO"],
  SINDICO: ["GESTAO", "CONSELHO"],
};

const criarUsuarioSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["SINDICO", "GESTAO", "CONSELHO"]),
});

export async function GET() {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "usuarios.gerenciar")) return forbidden();

  const usuarios = await db.user.findMany({
    where: { role: { not: "MASTER" } },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "usuarios.gerenciar")) return forbidden();

  const body = await req.json();
  const parsed = criarUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;

  // Verifica se o role é permitido para quem está criando
  const rolesCriáveis = ROLES_CRIÁVEIS[session.user.role] ?? [];
  if (!rolesCriáveis.includes(role)) {
    return NextResponse.json({ error: "Você não pode criar este perfil" }, { status: 403 });
  }

  const existe = await db.user.findFirst({ where: { email } });
  if (existe) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const usuario = await db.user.create({
    data: { name, email, password: hash, role },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
