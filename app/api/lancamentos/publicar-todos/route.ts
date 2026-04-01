import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const result = await prisma.lancamento.updateMany({
    where: { periodo: parsed.data.periodo, status: "RASCUNHO" },
    data: { status: "PUBLICADO" },
  });

  return NextResponse.json({ publicados: result.count });
}
