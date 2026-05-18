"use client";

import Link from "next/link";
import { ArrowLeft, Paperclip, Lock } from "lucide-react";
import { formatarDataExtenso, formatarDataHoraAmigavel } from "@/lib/utils";

export type DemandStatusPublic =
  | "RECEBIDA"
  | "EM_ANALISE"
  | "EM_ANDAMENTO"
  | "RESOLVIDA"
  | "ENCERRADA_SEM_ACAO";

export type DemandCategoryPublic =
  | "MANUTENCAO" | "SEGURANCA" | "LIMPEZA" | "FINANCEIRO" | "BARULHO"
  | "ILUMINACAO" | "VAZAMENTO" | "SUGESTAO" | "RECLAMACAO" | "OUTROS";

export interface DemandUpdatePublic {
  previousStatus: DemandStatusPublic | null;
  newStatus: DemandStatusPublic;
  message: string | null;
  createdAt: string;
}

export interface DemandaPublicData {
  protocol: string;
  status: DemandStatusPublic;
  category: DemandCategoryPublic;
  title: string;
  description: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  closedAt: string | null;
  updates: DemandUpdatePublic[];
}

const STATUS_LABEL: Record<DemandStatusPublic, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ENCERRADA_SEM_ACAO: "Encerrada sem ação",
};

const STATUS_BADGE: Record<DemandStatusPublic, string> = {
  RECEBIDA: "badge badge-neutral",
  EM_ANALISE: "badge badge-warning",
  EM_ANDAMENTO: "badge badge-warning",
  RESOLVIDA: "badge badge-success",
  ENCERRADA_SEM_ACAO: "badge badge-neutral",
};

const CATEGORY_LABEL: Record<DemandCategoryPublic, string> = {
  MANUTENCAO: "Manutenção", SEGURANCA: "Segurança", LIMPEZA: "Limpeza",
  FINANCEIRO: "Financeiro", BARULHO: "Barulho", ILUMINACAO: "Iluminação",
  VAZAMENTO: "Vazamento", SUGESTAO: "Sugestão", RECLAMACAO: "Reclamação",
  OUTROS: "Outros",
};

function historyLabel(update: DemandUpdatePublic): string {
  if (!update.previousStatus) return "Demanda registrada";
  return STATUS_LABEL[update.newStatus];
}

interface Props {
  data: DemandaPublicData;
  protocol: string;
}

export default function DemandaDetalhePublico({ data, protocol }: Props) {
  return (
    <div className="animate-page-enter max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/demandas/acompanhar"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-foreground transition-colors duration-150 mb-6"
        style={{ minHeight: "auto" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Nova consulta
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={STATUS_BADGE[data.status]}>
            {STATUS_LABEL[data.status]}
          </span>
          <span className="badge badge-neutral">
            {CATEGORY_LABEL[data.category]}
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight leading-snug">
          {data.title}
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
          Protocolo:{" "}
          <span className="font-mono font-bold text-primary tabular-nums">{protocol}</span>
          {" · "}
          Aberta em {formatarDataExtenso(data.createdAt)}
        </p>
      </div>

      {/* Descrição */}
      <div className="bg-[var(--surface-raised)] border border-border rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">
          Descrição
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {data.description}
        </p>
      </div>

      {/* Anexo */}
      {data.attachmentUrl && (
        <a
          href={data.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[var(--primary-subtle)] border border-border rounded-xl px-4 py-3 mb-4 text-primary hover:bg-[var(--surface-raised)] transition-colors duration-150"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">
            {data.attachmentName ?? "Ver anexo"}
          </span>
          <span className="text-xs text-[var(--foreground-muted)] ml-auto flex-shrink-0">
            abrir
          </span>
        </a>
      )}

      {/* Histórico */}
      <div>
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Histórico de andamento
          </h2>
        </div>

        <div className="space-y-3">
          {data.updates.map((update, i) => (
            <div
              key={i}
              className="border-l-2 border-[var(--border)] pl-4 py-1"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {historyLabel(update)}
                </span>
                <span className="text-xs text-[var(--foreground-muted)] flex-shrink-0 tabular-nums">
                  {formatarDataHoraAmigavel(update.createdAt)}
                </span>
              </div>
              {update.message && (
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed bg-[var(--surface-raised)] border border-border rounded-lg px-3 py-2 mt-1">
                  {update.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nota de privacidade */}
      <div className="mt-8 flex items-start gap-3 border border-border rounded-xl px-4 py-3.5">
        <Lock className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
          Por questões de privacidade e segurança, informações pessoais do
          solicitante não são exibidas nesta consulta.
        </p>
      </div>
    </div>
  );
}
