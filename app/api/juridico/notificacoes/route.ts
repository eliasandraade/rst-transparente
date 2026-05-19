import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registrarAuditoria, validarBloco, validarUnidade } from "@/lib/juridico";
import type { NotificacaoStatus } from "@prisma/client";

const VALID_STATUS: NotificacaoStatus[] = [
  "EMITIDA", "ENTREGUE", "RESPONDIDA", "CONTESTADA", "ARQUIVADA",
];

const CreateNotificacaoSchema = z.object({
  processoId: z.string().optional().nullable(),
  bloco: z.string().min(1).max(1).toUpperCase(),
  unidade: z.string().min(3).max(3),
  motivo: z.string().min(3, "Motivo muito curto").max(200),
  descricaoInterna: z.string().max(2000).optional().nullable(),
  dataEmissao: z.string().min(1, "Data de emissão obrigatória"),
  anexoUrl: z.string().url().optional().nullable(),
  anexoNome: z.string().max(200).optional().nullable(),
}).refine((d) => validarBloco(d.bloco), { message: "Bloco inválido (A–I)", path: ["bloco"] })
  .refine((d) => validarUnidade(d.unidade), { message: "Unidade inválida", path: ["unidade"] });

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = CreateNotificacaoSchema.parse(body);
    const usuarioId = (session.user as { id?: string })?.id ?? null;

    const notificacao = await prisma.notificacao.create({
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
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const bloco = searchParams.get("bloco") ?? undefined;
  const unidade = searchParams.get("unidade") ?? undefined;

  const status =
    rawStatus && VALID_STATUS.includes(rawStatus as NotificacaoStatus)
      ? (rawStatus as NotificacaoStatus)
      : undefined;

  try {
    const notificacoes = await prisma.notificacao.findMany({
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
