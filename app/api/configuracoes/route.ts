import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nomeCondominio: z.string().min(3),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASTER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const config = await prisma.configPortal.upsert({
    where: { id: "config-principal" },
    update: parsed.data,
    create: { id: "config-principal", ...parsed.data },
  });

  return NextResponse.json(config);
}
