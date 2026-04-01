import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ROLES_PERMITIDOS = ["MASTER", "SINDICO"] as const;

// Roles que cada perfil pode criar
const ROLES_CRIÁVEIS: Record<string, string[]> = {
  MASTER: ["SINDICO", "GESTAO", "CONSELHO"],
  SINDICO: ["GESTAO", "CONSELHO"],
};

const criarUsuarioSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["SINDICO", "GESTAO", "CONSELHO"]),
});

export async function GET() {
  const session = await auth();
  if (!session || !ROLES_PERMITIDOS.includes(session.user.role as typeof ROLES_PERMITIDOS[number])) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    where: { role: { not: "MASTER" } },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !ROLES_PERMITIDOS.includes(session.user.role as typeof ROLES_PERMITIDOS[number])) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

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

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const usuario = await prisma.user.create({
    data: { name, email, password: hash, role },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
