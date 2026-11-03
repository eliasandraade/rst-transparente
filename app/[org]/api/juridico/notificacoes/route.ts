import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { requireTenant, tenantDb } from "@/lib/tenant";
import { parseUnitLayout, validarBloco, validarUnidade } from "@/lib/units";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/juridico";
import type { NotificacaoStatus } from "@prisma/client";

const VALID_STATUS: NotificacaoStatus[] = [
  "EMITIDA", "ENTREGUE", "RESPONDIDA", "CONTESTADA", "ARQUIVADA",
];

const CreateNotificacaoSchema = z.object({
  processoId: z.string().optional().nullable(),
  bloco: z.string().trim().min(1).max(10).toUpperCase(),
  unidade: z.string().trim().min(1).max(10).toUpperCase(),
  motivo: z.string().min(3, "Motivo muito curto").max(200),
  descricaoInterna: z.string().max(2000).optional().nullable(),
  dataEmissao: z.string().min(1, "Data de emissão obrigatória"),
  anexoUrl: z.string().url().optional().nullable(),
  anexoNome: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  const { org, db } = await requireTenant();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  try {
    const body = await request.json();
    const data = CreateNotificacaoSchema.parse(body);
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

    const notificacao = await db.notificacao.create({
      data: {
        processoId: data.processoId ?? null,
        bloco: data.bloco.toUpperCase(),
        unidade: data.unidade,
        motivo: data.motivo,
        descricaoInterna: data.descricaoInterna ?? null,
        dataEmissao: new Date(data.dataEmissao),
        anexoUrl: data.anexoUrl ?? null,
        anexoNome: data.anexoNome ?? null,
        criadoPorId: usuarioId,
      },
    });

    await registrarAuditoria({
      entidade: "NOTIFICACAO",
      entidadeId: notificacao.id,
      acao: "CRIACAO",
      valorAnterior: null,
      valorNovo: { bloco: notificacao.bloco, unidade: notificacao.unidade, motivo: notificacao.motivo },
      usuarioId,
    });

    return NextResponse.json(notificacao, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/juridico/notificacoes]", err);
    return NextResponse.json({ error: "Erro ao criar notificação." }, { status: 500 });
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
    rawStatus && VALID_STATUS.includes(rawStatus as NotificacaoStatus)
      ? (rawStatus as NotificacaoStatus)
      : undefined;

  try {
    const notificacoes = await db.notificacao.findMany({
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

    return NextResponse.json(notificacoes);
  } catch (err) {
    console.error("[GET /api/juridico/notificacoes]", err);
    return NextResponse.json({ error: "Erro ao buscar notificações." }, { status: 500 });
  }
}
