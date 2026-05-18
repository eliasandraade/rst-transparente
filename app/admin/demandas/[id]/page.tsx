export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Paperclip } from "lucide-react";
import { formatarData, formatarDataExtenso, formatarDataHoraAmigavel } from "@/lib/utils";
import DemandaAtualizarForm from "@/components/admin/DemandaAtualizarForm";
import DemandaEncerrarModal from "@/components/admin/DemandaEncerrarModal";
import type { Metadata } from "next";
import type { DemandStatus, DemandCategory } from "@prisma/client";

export const metadata: Metadata = { title: "Detalhe da Demanda" };

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<DemandStatus, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ENCERRADA_SEM_ACAO: "Encerrada sem ação",
};

const STATUS_CLASS: Record<DemandStatus, string> = {
  RECEBIDA: "bg-blue-100 text-blue-700",
  EM_ANALISE: "bg-yellow-100 text-yellow-700",
  EM_ANDAMENTO: "bg-purple-100 text-purple-700",
  RESOLVIDA: "bg-green-100 text-green-700",
  ENCERRADA_SEM_ACAO: "bg-gray-100 text-gray-500",
};

const CATEGORY_LABEL: Record<DemandCategory, string> = {
  MANUTENCAO: "Manutenção", SEGURANCA: "Segurança", LIMPEZA: "Limpeza",
  FINANCEIRO: "Financeiro", BARULHO: "Barulho", ILUMINACAO: "Iluminação",
  VAZAMENTO: "Vazamento", SUGESTAO: "Sugestão", RECLAMACAO: "Reclamação",
  OUTROS: "Outros",
};

const isEncerrada = (status: DemandStatus) =>
  status === "RESOLVIDA" || status === "ENCERRADA_SEM_ACAO";

export default async function AdminDemandaDetailPage({ params }: Props) {
  const { id } = await params;

  const demand = await prisma.demand.findUnique({
    where: { id },
    include: {
      updates: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true, role: true } } },
      },
    },
  });

  if (!demand) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/demandas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para demandas
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CLASS[demand.status]}`}>
            {STATUS_LABEL[demand.status]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {CATEGORY_LABEL[demand.category]}
          </span>
        </div>

        <h1 className="text-xl font-bold">{demand.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-mono font-bold text-primary">{demand.protocol}</span>
          {" · "}
          Aberta em {formatarDataExtenso(demand.createdAt)}
          {demand.closedAt && (
            <> · Encerrada em {formatarData(demand.closedAt)}</>
          )}
        </p>
      </div>

      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-amber-700" aria-hidden="true" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
            Informações restritas à gestão do condomínio
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">Nome</p>
            <p className="font-semibold text-amber-900">{demand.requesterName}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">Unidade</p>
            <p className="font-semibold text-amber-900">{demand.unit}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">Telefone</p>
            <p className="font-semibold text-amber-900">{demand.phone}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">E-mail</p>
            <p className="font-semibold text-amber-900">
              {demand.email ?? <span className="text-amber-500 italic">Não informado</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          Descrição
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {demand.description}
        </p>
      </div>

      {demand.attachmentUrl && (
        <a
          href={demand.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-primary hover:bg-blue-100 transition-colors"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">
            {demand.attachmentName ?? "Ver anexo"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">↗ abrir</span>
        </a>
      )}

      {!isEncerrada(demand.status) && (
        <div className="card">
          <h2 className="font-semibold mb-4">Atualizar demanda</h2>
          <DemandaAtualizarForm
            demandId={demand.id}
            currentStatus={demand.status}
          />
          <div className="mt-3 pt-3 border-t border-border">
            <DemandaEncerrarModal demandId={demand.id} />
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Histórico</h2>
        <div className="space-y-3">
          {demand.updates.map((update) => (
            <div key={update.id} className="border-l-2 border-primary/30 pl-4 py-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-bold">
                  {update.previousStatus
                    ? `${STATUS_LABEL[update.previousStatus]} → ${STATUS_LABEL[update.newStatus]}`
                    : STATUS_LABEL[update.newStatus]}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatarDataHoraAmigavel(update.createdAt)}
                </span>
              </div>
              {update.message && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {update.message}
                </p>
              )}
              {update.createdBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  por {update.createdBy.name} ({update.createdBy.role})
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
