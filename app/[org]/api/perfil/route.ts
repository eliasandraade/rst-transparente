import { NextResponse } from "next/server";
import { staffSession } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { z } from "zod";

const AlterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: z.string().min(8, "Mínimo 8 caracteres"),
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export async function PATCH(request: Request) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const dados = AlterarSenhaSchema.parse(body);

    const usuario = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const senhaCorreta = await bcrypt.compare(
      dados.senhaAtual,
      usuario.password
    );
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(dados.novaSenha, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    );
  }
}
