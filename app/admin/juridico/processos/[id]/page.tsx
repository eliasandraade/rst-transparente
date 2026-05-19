export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarNumeroProcesso } from "@/lib/juridico";
import { formatarData, formatarDataHoraAmigavel } from "@/lib/utils";
import type { Metadata } from "next";
import { ArrowLeft, RefreshCw, Archive } from "lucide-react";
import ProcessoSyncButton from "@/components/admin/juridico/ProcessoSyncButton";
import ProcessoArquivarButton from "@/components/admin/juridico/ProcessoArquivarButton";
import type { ProcessoStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Processo | Jurídico | Admin" };

const STATUS_BADGE: Record<ProcessoStatus, string> = {
  ATIVO: "badge badge-success",
  SUSPENSO: "badge badge-warning",
  ENCERRADO: "badge badge-neutral",
  ARQUIVADO: "badge badge-neutral",
};
const STATUS_LABEL: Record<ProcessoStatus, string> = {
  ATIVO: "Ativo", SUSPENSO: "Suspenso", ENCERRADO: "Encerrado", ARQUIVADO: "Arquivado",
};

export default async function ProcessoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      notificacoes: {
        where: { ativo: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, bloco: true, unidade: true, motivo: true, status: true, dataEmissao: true },
      },
      multas: {
        where: { ativo: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, bloco: true, unidade: true, motivo: true, valor: true, status: true, dataAplicacao: true },
      },
    },
  });

  if (!processo) notFound();

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <Link
          href="/admin/juridico/processos"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-foreground mb-3 transition-colors"
          style={{ minHeight: "auto" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Processos
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={STATUS_BADGE[processo.status]}>{STATUS_LABEL[processo.status]}</span>
              {!processo.ativo && (
                <span className="badge badge-neutral flex items-center gap-1">
                  <Archive className="w-2.5 h-2.5" aria-hidden="true" />
                  Arquivado
                </span>
              )}
              {processo.origem === "DATAJUD" && (
                <span className="badge badge-neutral flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" aria-hidden="true" />
                  DataJud
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-foreground font-mono tracking-wider tabular-nums">
              {formatarNumeroProcesso(processo.numeroProcesso)}
            </h1>
            {processo.ultimaSincronizacao && (
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Sincronizado em {formatarDataHoraAmigavel(processo.ultimaSincronizacao)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ProcessoArquivarButton processoId={processo.id} ativo={processo.ativo} />
            <ProcessoSyncButton processoId={processo.id} />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-3xl">
        {/* Dados do processo */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Dados do processo</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: "Tribunal", value: processo.tribunal },
              { label: "Grau", value: processo.grau },
              { label: "Classe processual", value: processo.classe },
              { label: "Assunto", value: processo.assunto },
              { label: "Órgão julgador", value: processo.orgaoJulgador },
              { label: "Data ajuizamento", value: processo.dataAjuizamento ? formatarData(processo.dataAjuizamento) : null },
              { label: "Última movimentação", value: processo.ultimaMovimentacao },
              { label: "Data última movim.", value: processo.dataUltimaMovim ? formatarDataHoraAmigavel(processo.dataUltimaMovim) : null },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-[var(--foreground-subtle)] font-medium mb-0.5">{label}</dt>
                <dd className="text-sm text-foreground">{value ?? <span className="text-[var(--foreground-muted)]">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Resumo público */}
        <div className="card">
          <h2 className="text-sm font-semibold text-foreground mb-2">Resumo público</h2>
          {processo.resumoPublico ? (
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed whitespace-pre-wrap">
              {processo.resumoPublico}
            </p>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)] italic">Nenhum resumo público cadastrado.</p>
          )}
        </div>

        {/* Observações internas */}
        {processo.observacoesInternas && (
          <div className="card border-l-4 border-[var(--warning)]">
            <p className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-1">
              Observações internas
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {processo.observacoesInternas}
            </p>
          </div>
        )}

        {/* Notificações vinculadas */}
        {processo.notificacoes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Notificações vinculadas</h2>
              <Link href={`/admin/juridico/notificacoes?processoId=${processo.id}`} className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="card overflow-hidden p-0">
              <table className="w-full text-xs">
                <thead className="bg-[var(--surface-raised)]">
                  <tr className="text-[var(--foreground-subtle)] font-semibold uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Unidade</th>
                    <th className="px-4 py-2.5 text-left">Motivo</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processo.notificacoes.map((n) => (
                    <tr key={n.id} className="hover:bg-[var(--surface-raised)]">
                      <td className="px-4 py-2.5 font-mono font-semibold">Bl.{n.bloco} / {n.unidade}</td>
                      <td className="px-4 py-2.5 text-[var(--foreground-muted)] truncate max-w-[180px]">{n.motivo}</td>
                      <td className="px-4 py-2.5"><span className="badge badge-neutral">{n.status}</span></td>
                      <td className="px-4 py-2.5 text-[var(--foreground-muted)] tabular-nums">{formatarData(n.dataEmissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Multas vinculadas */}
        {processo.multas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Multas vinculadas</h2>
              <Link href={`/admin/juridico/multas?processoId=${processo.id}`} className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="card overflow-hidden p-0">
              <table className="w-full text-xs">
                <thead className="bg-[var(--surface-raised)]">
                  <tr className="text-[var(--foreground-subtle)] font-semibold uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Unidade</th>
                    <th className="px-4 py-2.5 text-left">Motivo</th>
                    <th className="px-4 py-2.5 text-left">Valor</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processo.multas.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--surface-raised)]">
                      <td className="px-4 py-2.5 font-mono font-semibold">Bl.{m.bloco} / {m.unidade}</td>
                      <td className="px-4 py-2.5 text-[var(--foreground-muted)] truncate max-w-[160px]">{m.motivo}</td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums text-[var(--danger)]">
                        {Number(m.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-4 py-2.5"><span className="badge badge-neutral">{m.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
