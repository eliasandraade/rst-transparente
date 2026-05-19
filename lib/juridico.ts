import { prisma } from "@/lib/prisma";
import type { JuridicoEntidade, ProcessoStatus } from "@prisma/client";

// ─── Constantes ───────────────────────────────────────────────────────────────

export const DATAJUD_ENDPOINT =
  "https://api-publica.datajud.cnj.jus.br/api_publica_tjce/_search";

export const BLOCOS_VALIDOS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
export type BlocoValido = (typeof BLOCOS_VALIDOS)[number];

// Unidades válidas por pavimento: 101-108, 201-208, 301-308, 401-408
const UNIDADES_VALIDAS = new Set<string>(
  [1, 2, 3, 4].flatMap((pav) =>
    [1, 2, 3, 4, 5, 6, 7, 8].map((u) => `${pav}0${u}`)
  )
);

// ─── Validação ────────────────────────────────────────────────────────────────

export function validarBloco(bloco: string): boolean {
  return BLOCOS_VALIDOS.includes(bloco.toUpperCase() as BlocoValido);
}

export function validarUnidade(unidade: string): boolean {
  return UNIDADES_VALIDAS.has(unidade);
}

// ─── Mascaramento ─────────────────────────────────────────────────────────────

/**
 * Mascara número CNJ para exibição pública.
 * Formato completo:  NNNNNNN-DD.AAAA.J.TT.OOOO
 * Posições (sem sep): [0-6]=seq [7-8]=dígito [9-12]=ano [13]=ramo [14-15]=tribunal [16-19]=órgão
 * Output público:    *******-**.AAAA.J.TT.****
 */
export function mascarNumeroProcesso(numero: string): string {
  // Remove qualquer separador para normalizar
  const raw = numero.replace(/[.\-]/g, "");
  if (raw.length < 20) return "*******-**.????.?.??.****";

  const ano = raw.slice(9, 13);
  const ramo = raw.slice(13, 14);
  const tribunal = raw.slice(14, 16);

  return `*******-**.${ano}.${ramo}.${tribunal}.****`;
}

/**
 * Formata número CNJ para exibição completa no admin.
 * NNNNNNN-DD.AAAA.J.TT.OOOO
 */
export function formatarNumeroProcesso(numero: string): string {
  const raw = numero.replace(/[.\-]/g, "");
  if (raw.length < 20) return numero;
  return `${raw.slice(0, 7)}-${raw.slice(7, 9)}.${raw.slice(9, 13)}.${raw.slice(13, 14)}.${raw.slice(14, 16)}.${raw.slice(16, 20)}`;
}

/**
 * Normaliza número de processo para 20 dígitos (remove separadores).
 */
export function normalizarNumeroProcesso(numero: string): string {
  return numero.replace(/[.\-\s]/g, "");
}

// ─── Sincronização DataJud ────────────────────────────────────────────────────

export interface DataJudProcesso {
  classe?: string;
  assunto?: string;
  orgaoJulgador?: string;
  grau?: string;
  dataAjuizamento?: string;
  ultimaMovimentacao?: string;
  dataUltimaMovim?: string;
}

interface DataJudHit {
  _source: {
    classeProcessual?: { nome?: string };
    assuntos?: Array<{ nome?: string }>;
    orgaoJulgador?: { nome?: string };
    grau?: string;
    dataAjuizamento?: string;
    movimentos?: Array<{ nome?: string; dataHora?: string }>;
    sigiloso?: boolean;
    // partes intencionalmente ignorado — LGPD
  };
}

interface DataJudResponse {
  hits?: {
    hits?: DataJudHit[];
  };
}

export async function buscarProcessoDataJud(
  numeroProcesso: string
): Promise<DataJudProcesso | null> {
  const apiKey = process.env.DATAJUD_API_KEY;
  if (!apiKey) throw new Error("DATAJUD_API_KEY não configurada");

  const raw = normalizarNumeroProcesso(numeroProcesso);

  const res = await fetch(DATAJUD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `APIKey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { match: { numeroProcesso: raw } },
    }),
    // Timeout via AbortController
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`DataJud retornou status ${res.status}`);
  }

  const data: DataJudResponse = await res.json();
  const hit = data?.hits?.hits?.[0];
  if (!hit) return null;

  const src = hit._source;
  const movimentos = src.movimentos ?? [];
  const ultimoMovimento = movimentos[movimentos.length - 1];

  return {
    classe: src.classeProcessual?.nome ?? undefined,
    assunto: src.assuntos?.[0]?.nome ?? undefined,
    orgaoJulgador: src.orgaoJulgador?.nome ?? undefined,
    grau: src.grau ?? undefined,
    dataAjuizamento: src.dataAjuizamento ?? undefined,
    ultimaMovimentacao: ultimoMovimento?.nome ?? undefined,
    dataUltimaMovim: ultimoMovimento?.dataHora ?? undefined,
  };
}

// ─── Sync de um processo ──────────────────────────────────────────────────────

export interface SyncResult {
  id: string;
  numeroProcesso: string;
  sucesso: boolean;
  erro?: string;
}

export async function syncProcesso(
  processoId: string,
  usuarioId: string | null
): Promise<SyncResult> {
  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
  });

  if (!processo) {
    return { id: processoId, numeroProcesso: "", sucesso: false, erro: "Processo não encontrado" };
  }

  try {
    const dados = await buscarProcessoDataJud(processo.numeroProcesso);

    if (!dados) {
      await registrarAuditoria({
        entidade: "PROCESSO",
        entidadeId: processoId,
        acao: "SINCRONIZACAO",
        valorAnterior: null,
        valorNovo: null,
        usuarioId,
        observacao: "Processo não encontrado na API DataJud",
      });
      return {
        id: processoId,
        numeroProcesso: processo.numeroProcesso,
        sucesso: false,
        erro: "Processo não encontrado na API DataJud",
      };
    }

    const anterior = {
      classe: processo.classe,
      assunto: processo.assunto,
      orgaoJulgador: processo.orgaoJulgador,
      grau: processo.grau,
      dataAjuizamento: processo.dataAjuizamento,
      ultimaMovimentacao: processo.ultimaMovimentacao,
      dataUltimaMovim: processo.dataUltimaMovim,
    };

    const toDate = (s?: string) => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d; };

    await prisma.processo.update({
      where: { id: processoId },
      data: {
        classe: dados.classe ?? processo.classe,
        assunto: dados.assunto ?? processo.assunto,
        orgaoJulgador: dados.orgaoJulgador ?? processo.orgaoJulgador,
        grau: dados.grau ?? processo.grau,
        dataAjuizamento: toDate(dados.dataAjuizamento) ?? processo.dataAjuizamento,
        ultimaMovimentacao: dados.ultimaMovimentacao ?? processo.ultimaMovimentacao,
        dataUltimaMovim: toDate(dados.dataUltimaMovim) ?? processo.dataUltimaMovim,
        ultimaSincronizacao: new Date(),
        origem: "DATAJUD",
      },
    });

    await registrarAuditoria({
      entidade: "PROCESSO",
      entidadeId: processoId,
      acao: "SINCRONIZACAO",
      valorAnterior: anterior,
      valorNovo: dados,
      usuarioId,
      observacao: "Sincronização manual via DataJud/TJCE",
    });

    return { id: processoId, numeroProcesso: processo.numeroProcesso, sucesso: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    await registrarAuditoria({
      entidade: "PROCESSO",
      entidadeId: processoId,
      acao: "SINCRONIZACAO",
      valorAnterior: null,
      valorNovo: null,
      usuarioId,
      observacao: `Erro na sincronização: ${msg}`,
    });
    return {
      id: processoId,
      numeroProcesso: processo.numeroProcesso,
      sucesso: false,
      erro: msg,
    };
  }
}

// ─── Sync de todos os processos ativos ───────────────────────────────────────

export async function syncTodosProcessos(usuarioId: string | null): Promise<{
  total: number;
  sucesso: number;
  erros: number;
  resultados: SyncResult[];
}> {
  const processos = await prisma.processo.findMany({
    where: { ativo: true, status: { in: ["ATIVO", "SUSPENSO"] as ProcessoStatus[] } },
    select: { id: true },
  });

  const resultados: SyncResult[] = [];

  for (const { id } of processos) {
    const r = await syncProcesso(id, usuarioId);
    resultados.push(r);
  }

  const sucesso = resultados.filter((r) => r.sucesso).length;

  return {
    total: processos.length,
    sucesso,
    erros: processos.length - sucesso,
    resultados,
  };
}

// ─── Auditoria ────────────────────────────────────────────────────────────────

interface AuditoriaInput {
  entidade: JuridicoEntidade;
  entidadeId: string;
  acao: string;
  valorAnterior: unknown;
  valorNovo: unknown;
  usuarioId: string | null;
  observacao?: string;
}

export async function registrarAuditoria(input: AuditoriaInput): Promise<void> {
  await prisma.juridicoAuditoria.create({
    data: {
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      acao: input.acao,
      valorAnterior: input.valorAnterior ? (input.valorAnterior as object) : undefined,
      valorNovo: input.valorNovo ? (input.valorNovo as object) : undefined,
      usuarioId: input.usuarioId ?? undefined,
      observacao: input.observacao,
    },
  });
}
