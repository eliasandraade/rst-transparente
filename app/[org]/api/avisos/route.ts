import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";

const AvisoSchema = z.object({
  titulo: z.string().min(1).max(200),
  corpo: z.string().min(1),
  fixado: z.boolean().optional(),
  status: z.enum(["RASCUNHO", "PUBLICADO"]).optional(),
});

export async function GET() {
  const db = await tenantDb();
  try {
    const avisos = await db.aviso.findMany({
      where: { status: "PUBLICADO" },
      orderBy: [{ fixado: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(avisos);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar avisos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "avisos.editar")) return forbidden();

  try {
    const body = await request.json();
    const dados = AvisoSchema.parse(body);

    const aviso = await db.aviso.create({
      data: {
        titulo: dados.titulo,
        corpo: dados.corpo,
        fixado: dados.fixado ?? false,
        status: dados.status ?? "RASCUNHO",
      },
    });

    return NextResponse.json(aviso, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar aviso" }, { status: 500 });
  }
}
