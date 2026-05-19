import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/juridico";
import type { ProcessoStatus } from "@prisma/client";

const VALID_STATUS: ProcessoStatus[] = ["ATIVO", "SUSPENSO", "ENCERRADO", "ARQUIVADO"];

const PatchProcessoSchema = z.object({
  status: z.enum(["ATIVO", "SUSPENSO", "ENCERRADO", "ARQUIVADO"]).optional(),
  resumoPublico: z.string().max(1000).optional().nullable(),
  observacoesInternas: z.string().max(2000).optional().nullable(),
  ativo: z.boolean().optional(),
  observacao: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = PatchProcessoSchema.parse(body);

    const atual = await prisma.processo.findUnique({ where: { id } });
    if (!atual) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

    const statusMudou = data.status && data.status !== atual.status;
    const arquivando = data.ativo === false && atual.ativo === true;

    const atualizado = await prisma.processo.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(typeof data.resumoPublico !== "undefined"
          ? { resumoPublico: data.resumoPublico }
          : {}),
        ...(typeof data.observacoesInternas !== "undefined"
          ? { observacoesInternas: data.observacoesInternas }
          : {}),
        ...(typeof data.ativo !== "undefined" ? { ativo: data.ativo } : {}),
      },
    });

    const acao = arquivando
      ? "ARQUIVAMENTO"
      : statusMudou
      ? "MUDANCA_STATUS"
      : "EDICAO";

    await registrarAuditoria({
      entidade: "PROCESSO",
      entidadeId: id,
      acao,
      valorAnterior: {
        status: atual.status,
        resumoPublico: atual.resumoPublico,
        ativo: atual.ativo,
      },
      valorNovo: {
        status: atualizado.status,
        resumoPublico: atualizado.resumoPublico,
        ativo: atualizado.ativo,
      },
      usuarioId: (session.user as { id?: string })?.id ?? null,
      observacao: data.observacao,
    });

    return NextResponse.json(atualizado);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/juridico/processos/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar processo." }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const processo = await prisma.processo.findUnique({
      where: { id },
      include: {
        notificacoes: {
          where: { ativo: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, bloco: true, unidade: true, motivo: true, status: true, dataEmissao: true },
        },
        multas: {
          where: { ativo: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, bloco: true, unidade: true, motivo: true, valor: true, status: true, dataAplicacao: true },
        },
      },
    });

    if (!processo) return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });

    return NextResponse.json(processo);
  } catch (err) {
    console.error("[GET /api/juridico/processos/[id]]", err);
    return NextResponse.json({ error: "Erro ao buscar processo." }, { status: 500 });
  }
}
