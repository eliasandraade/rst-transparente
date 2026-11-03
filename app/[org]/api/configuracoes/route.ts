import { NextRequest, NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { requireTenant } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  nomeCondominio: z.string().min(3),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const { org, db } = await requireTenant();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "configuracoes.editar")) return forbidden();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Uma configuração por organização (config_portal.organizationId é único).
  const config = await db.configPortal.upsert({
    where: { organizationId: org.id },
    update: parsed.data,
    create: parsed.data,
  });

  return NextResponse.json(config);
}
