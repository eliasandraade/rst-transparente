"use client";

import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";
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

const STATUS_CLASS: Record<DemandStatusPublic, string> = {
  RECEBIDA: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-yellow-100 text-yellow-800",
  EM_ANDAMENTO: "bg-purple-100 text-purple-800",
  RESOLVIDA: "bg-green-100 text-green-800",
  ENCERRADA_SEM_ACAO: "bg-gray-100 text-gray-600",
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/demandas/acompanhar"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Nova consulta
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CLASS[data.status]}`}
          >
            {STATUS_LABEL[data.status]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {CATEGORY_LABEL[data.category]}
          </span>
        </div>
        <h1 className="text-xl font-bold leading-snug">{data.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Protocolo:{" "}
          <span className="font-mono font-bold text-primary">{protocol}</span>
          {" · "}
          Aberta em {formatarDataExtenso(data.createdAt)}
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl p-5 mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          Descrição
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {data.description}
        </p>
      </div>

      {data.attachmentUrl && (
        <a
          href={data.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-primary hover:bg-blue-100 transition-colors"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">
            {data.attachmentName ?? "Ver anexo"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            ↗ abrir
          </span>
        </a>
      )}

      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
          Histórico de andamento
        </h2>

        <div className="space-y-3">
          {data.updates.map((update, i) => (
            <div
              key={i}
              className="border-l-2 border-primary/30 pl-4 py-1"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-bold text-foreground">
                  {historyLabel(update)}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatarDataHoraAmigavel(update.createdAt)}
                </span>
              </div>
              {update.message && (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2 mt-1">
                  {update.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-muted rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        🔒 Por questões de privacidade e segurança, informações pessoais do
        solicitante não são exibidas nesta consulta.
      </div>
    </div>
  );
}
