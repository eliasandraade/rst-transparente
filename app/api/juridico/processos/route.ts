import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  normalizarNumeroProcesso,
  buscarProcessoDataJud,
  registrarAuditoria,
  validarBloco,
  validarUnidade,
} from "@/lib/juridico";
import type { ProcessoStatus, DemandCategory } from "@prisma/client";

const VALID_STATUS = ["ATIVO", "SUSPENSO", "ENCERRADO", "ARQUIVADO"] as const;

const CreateProcessoSchema = z.object({
  numeroProcesso: z.string().min(15, "Número de processo inválido").max(30),
  resumoPublico: z.string().max(1000).optional().nullable(),
  observacoesInternas: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = CreateProcessoSchema.parse(body);
    const numeroNormalizado = normalizarNumeroProcesso(data.numeroProcesso);

    const existente = await prisma.processo.findUnique({
      where: { numeroProcesso: numeroNormalizado },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Processo já cadastrado com este número." },
        { status: 409 }
      );
    }

    // Busca dados no DataJud imediatamente
    let dadosDataJud = null;
    let erroSync: string | null = null;
    try {
      dadosDataJud = await buscarProcessoDataJud(numeroNormalizado);
    } catch (err) {
      erroSync = err instanceof Error ? err.message : "Erro na API DataJud";
    }

    const processo = await prisma.processo.create({
      data: {
        numeroProcesso: numeroNormalizado,
        tribunal: "TJCE",
        classe: dadosDataJud?.classe ?? null,
        assunto: dadosDataJud?.assunto ?? null,
        orgaoJulgador: dadosDataJud?.orgaoJulgador ?? null,
        grau: dadosDataJud?.grau ?? null,
        dataAjuizamento: dadosDataJud?.dataAjuizamento
          ? new Date(dadosDataJud.dataAjuizamento)
          : null,
        ultimaMovimentacao: dadosDataJud?.ultimaMovimentacao ?? null,
        dataUltimaMovim: dadosDataJud?.dataUltimaMovim
          ? new Date(dadosDataJud.dataUltimaMovim)
          : null,
        resumoPublico: data.resumoPublico ?? null,
        observacoesInternas: data.observacoesInternas ?? null,
        origem: dadosDataJud ? "DATAJUD" : "MANUAL",
        ultimaSincronizacao: dadosDataJud ? new Date() : null,
      },
    });

    await registrarAuditoria({
      entidade: "PROCESSO",
      entidadeId: processo.id,
      acao: "CRIACAO",
      valorAnterior: null,
      valorNovo: {
        numeroProcesso: processo.numeroProcesso,
        origem: processo.origem,
        sincronizadoDataJud: !!dadosDataJud,
      },
      usuarioId: (session.user as { id?: string })?.id ?? null,
      observacao: erroSync
        ? `Cadastrado manualmente. Sync DataJud falhou: ${erroSync}`
        : undefined,
    });

    return NextResponse.json(
      { ...processo, avisoSync: erroSync },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/juridico/processos]", err);
    return NextResponse.json({ error: "Erro ao cadastrar processo." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const search = searchParams.get("search") ?? undefined;

  const status =
    rawStatus && VALID_STATUS.includes(rawStatus as ProcessoStatus)
      ? (rawStatus as ProcessoStatus)
      : undefined;

  try {
    const processos = await prisma.processo.findMany({
      where: {
        ativo: true,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { numeroProcesso: { contains: search, mode: "insensitive" } },
                { classe: { contains: search, mode: "insensitive" } },
                { assunto: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(processos);
  } catch (err) {
    console.error("[GET /api/juridico/processos]", err);
    return NextResponse.json({ error: "Erro ao buscar processos." }, { status: 500 });
  }
}
