import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { requireTenant, tenantDb } from "@/lib/tenant";
import { parseUnitLayout, validarBloco, validarUnidade } from "@/lib/units";
import { z } from "zod";
import { moneySchema } from "@/lib/money";
import { registrarAuditoria } from "@/lib/juridico";
import type { MultaStatus } from "@prisma/client";
import { errorSummary } from "@/lib/privacy";

const VALID_STATUS: MultaStatus[] = [
  "APLICADA", "NOTIFICADA", "CONTESTADA", "MANTIDA", "CANCELADA", "PAGA", "VENCIDA",
];

const CreateMultaSchema = z.object({
  processoId: z.string().optional().nullable(),
  bloco: z.string().trim().min(1).max(10).toUpperCase(),
  unidade: z.string().trim().min(1).max(10).toUpperCase(),
  motivo: z.string().min(3, "Motivo muito curto").max(200),
  descricaoInterna: z.string().max(2000).optional().nullable(),
  valor: moneySchema({ positive: true }),
  dataAplicacao: z.string().min(1, "Data de aplicação obrigatória"),
  dataVencimento: z.string().optional().nullable(),
  anexoUrl: z.string().url().max(500).refine((u) => u.startsWith("https://"), "Link precisa ser https").optional().nullable(),
  anexoNome: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  const { org, db } = await requireTenant();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  try {
    const body = await request.json();
    const data = CreateMultaSchema.parse(body);
    if (data.processoId && !(await db.processo.findFirst({ where: { id: data.processoId }, select: { id: true } }))) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 400 });
    }
    const layout = parseUnitLayout(org.unitLayout);
    if (!validarBloco(layout, data.bloco)) {
      return NextResponse.json({ error: "Bloco inválido" }, { status: 400 });
    }
    if (!validarUnidade(layout, data.unidade)) {
      return NextResponse.json({ error: "Unidade inválida" }, { status: 400 });
    }
    const usuarioId = (session.user as { id?: string })?.id ?? null;

    const multa = await db.multa.create({
      data: {
        processoId: data.processoId ?? null,
        bloco: data.bloco.toUpperCase(),
        unidade: data.unidade,
        motivo: data.motivo,
        descricaoInterna: data.descricaoInterna ?? null,
        valor: data.valor,
        dataAplicacao: new Date(data.dataAplicacao),
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
        anexoUrl: data.anexoUrl ?? null,
        anexoNome: data.anexoNome ?? null,
        criadoPorId: usuarioId,
      },
    });

    await registrarAuditoria({
      entidade: "MULTA",
      entidadeId: multa.id,
      acao: "CRIACAO",
      valorAnterior: null,
      valorNovo: {
        bloco: multa.bloco,
        unidade: multa.unidade,
        motivo: multa.motivo,
        valor: Number(multa.valor),
      },
      usuarioId,
    });

    return NextResponse.json(multa, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/juridico/multas]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao criar multa." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const bloco = searchParams.get("bloco") ?? undefined;
  const unidade = searchParams.get("unidade") ?? undefined;

  const status =
    rawStatus && VALID_STATUS.includes(rawStatus as MultaStatus)
      ? (rawStatus as MultaStatus)
      : undefined;

  try {
    const multas = await db.multa.findMany({
      where: {
        ativo: true,
        ...(status ? { status } : {}),
        ...(bloco ? { bloco: bloco.toUpperCase() } : {}),
        ...(unidade ? { unidade } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        criadoPor: { select: { name: true } },
        processo: { select: { id: true, numeroProcesso: true, classe: true } },
      },
    });

    return NextResponse.json(multas);
  } catch (err) {
    console.error("[GET /api/juridico/multas]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao buscar multas." }, { status: 500 });
  }
}
