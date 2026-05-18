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

const STATUS_BADGE: Record<DemandStatus, string> = {
  RECEBIDA: "badge badge-neutral",
  EM_ANALISE: "badge badge-warning",
  EM_ANDAMENTO: "badge badge-warning",
  RESOLVIDA: "badge badge-success",
  ENCERRADA_SEM_ACAO: "badge badge-neutral",
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
    <div className="space-y-5 max-w-2xl">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/demandas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-foreground transition-colors duration-150 mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Demandas
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={STATUS_BADGE[demand.status]}>
            {STATUS_LABEL[demand.status]}
          </span>
          <span className="badge badge-neutral">
            {CATEGORY_LABEL[demand.category]}
          </span>
        </div>

        <h1 className="text-xl font-bold text-foreground tracking-tight">{demand.title}</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
          <span className="font-mono font-bold text-primary tabular-nums">{demand.protocol}</span>
          {" · "}
          Aberta em {formatarDataExtenso(demand.createdAt)}
          {demand.closedAt && (
            <> · Encerrada em {formatarData(demand.closedAt)}</>
          )}
        </p>
      </div>

      {/* Dados restritos */}
      <div className="bg-[var(--warning-subtle)] border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-3.5 h-3.5 text-[var(--warning)]" aria-hidden="true" />
          <span className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider">
            Informações restritas à gestão
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-0.5">Nome</p>
            <p className="font-semibold text-foreground">{demand.requesterName}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-0.5">Unidade</p>
            <p className="font-semibold text-foreground">{demand.unit}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-0.5">Telefone</p>
            <p className="font-semibold text-foreground">{demand.phone}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-0.5">E-mail</p>
            <p className="font-semibold text-foreground">
              {demand.email ?? (
                <span className="text-[var(--foreground-muted)] font-normal italic">Não informado</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="card">
        <p className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">
          Descrição
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {demand.description}
        </p>
      </div>

      {/* Anexo */}
      {demand.attachmentUrl && (
        <a
          href={demand.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[var(--primary-subtle)] border border-border rounded-xl px-4 py-3 text-primary hover:bg-[var(--surface-raised)] transition-colors duration-150"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">
            {demand.attachmentName ?? "Ver anexo"}
          </span>
          <span className="text-xs text-[var(--foreground-muted)] ml-auto flex-shrink-0">abrir</span>
        </a>
      )}

      {/* Ações (só se aberta) */}
      {!isEncerrada(demand.status) && (
        <div className="card space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">Atualizar demanda</h2>
            </div>
            <DemandaAtualizarForm
              demandId={demand.id}
              currentStatus={demand.status}
            />
          </div>
          <div className="pt-3 border-t border-border">
            <DemandaEncerrarModal demandId={demand.id} />
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="card">
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
        </div>
        <div className="space-y-3">
          {demand.updates.map((update) => (
            <div key={update.id} className="border-l-2 border-[var(--border)] pl-4 py-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {update.previousStatus
                    ? `${STATUS_LABEL[update.previousStatus]} → ${STATUS_LABEL[update.newStatus]}`
                    : STATUS_LABEL[update.newStatus]}
                </span>
                <span className="text-xs text-[var(--foreground-muted)] flex-shrink-0 tabular-nums">
                  {formatarDataHoraAmigavel(update.createdAt)}
                </span>
              </div>
              {update.message && (
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                  {update.message}
                </p>
              )}
              {update.createdBy && (
                <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                  por {update.createdBy.name} · {update.createdBy.role}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
