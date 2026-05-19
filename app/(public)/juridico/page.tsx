export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { mascarNumeroProcesso } from "@/lib/juridico";
import { formatarMoeda, formatarDataExtenso } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Lock, Scale } from "lucide-react";
import type { ProcessoStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Transparência Jurídica",
  description:
    "Acompanhe os processos judiciais, notificações e multas do Condomínio Residencial Santíssima Trindade.",
};

const STATUS_BADGE: Record<ProcessoStatus, string> = {
  ATIVO: "badge badge-success",
  SUSPENSO: "badge badge-warning",
  ENCERRADO: "badge badge-neutral",
  ARQUIVADO: "badge badge-neutral",
};
const STATUS_LABEL: Record<ProcessoStatus, string> = {
  ATIVO: "Ativo", SUSPENSO: "Suspenso", ENCERRADO: "Encerrado", ARQUIVADO: "Arquivado",
};

export default async function JuridicoPublicPage() {
  const [
    processosAtivos,
    processosEncerrados,
    totalNotificacoes,
    totalMultas,
    valorTotalMultas,
    processos,
  ] = await Promise.all([
    prisma.processo.count({ where: { ativo: true, status: { in: ["ATIVO", "SUSPENSO"] } } }),
    prisma.processo.count({ where: { ativo: true, status: { in: ["ENCERRADO", "ARQUIVADO"] } } }),
    prisma.notificacao.count({ where: { ativo: true } }),
    prisma.multa.count({ where: { ativo: true } }),
    prisma.multa.aggregate({ where: { ativo: true }, _sum: { valor: true } }),
    prisma.processo.findMany({
      where: { ativo: true },
      orderBy: { dataUltimaMovim: { sort: "desc", nulls: "last" } },
      select: {
        id: true,
        numeroProcesso: true,
        tribunal: true,
        classe: true,
        assunto: true,
        status: true,
        dataUltimaMovim: true,
        resumoPublico: true,
      },
    }),
  ]);

  const valorTotal = Number(valorTotalMultas._sum.valor ?? 0);

  return (
    <div className="animate-page-enter">
      {/* Hero */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              Jurídico
            </span>
          </div>
          <h1 className="text-2xl sm:text-[1.875rem] font-bold text-foreground tracking-tight leading-tight">
            Transparência Jurídica
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mt-2 max-w-lg">
            Acompanhe os processos judiciais, notificações e multas do condomínio de forma
            transparente e segura.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Métricas */}
        <section aria-label="Indicadores jurídicos">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
                Processos ativos
              </p>
              <p className="text-2xl font-black tabular-nums text-foreground">{processosAtivos}</p>
              {processosEncerrados > 0 && (
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {processosEncerrados} encerrados
                </p>
              )}
            </div>

            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
                Notificações
              </p>
              <p className="text-2xl font-black tabular-nums text-foreground">{totalNotificacoes}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">emitidas</p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
                Multas aplicadas
              </p>
              <p className="text-2xl font-black tabular-nums text-foreground">{totalMultas}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">total</p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
                Valor das multas
              </p>
              <p className="text-xl font-black tabular-nums text-foreground leading-snug">
                {formatarMoeda(valorTotal)}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">acumulado</p>
            </div>
          </div>
        </section>

        {/* Lista de processos */}
        <section aria-label="Processos judiciais">
          <div className="flex items-center gap-2 mb-6">
            <Scale className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Processos judiciais
            </h2>
            {processos.length > 0 && (
              <span className="badge badge-neutral ml-0.5">{processos.length}</span>
            )}
          </div>

          {processos.length === 0 ? (
            <div className="card text-center py-12">
              <div
                className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3"
                aria-hidden="true"
              >
                <Scale className="w-5 h-5 text-[var(--foreground-subtle)]" />
              </div>
              <p className="text-[var(--foreground-muted)] text-sm">
                Nenhum processo cadastrado no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {processos.map((p) => (
                <article
                  key={p.id}
                  className="card"
                  aria-label={`Processo ${mascarNumeroProcesso(p.numeroProcesso)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold tabular-nums text-foreground tracking-wider">
                        {mascarNumeroProcesso(p.numeroProcesso)}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{p.tribunal}</p>
                    </div>
                    <span className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-[var(--foreground-muted)] mb-3">
                    {p.classe && (
                      <span>
                        <span className="font-medium text-foreground">Classe:</span> {p.classe}
                      </span>
                    )}
                    {p.assunto && (
                      <span>
                        <span className="font-medium text-foreground">Assunto:</span> {p.assunto}
                      </span>
                    )}
                    {p.dataUltimaMovim && (
                      <span>
                        <span className="font-medium text-foreground">Última movimentação:</span>{" "}
                        {formatarDataExtenso(p.dataUltimaMovim)}
                      </span>
                    )}
                  </div>

                  {p.resumoPublico && (
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed bg-[var(--surface-raised)] border border-border rounded-lg px-3 py-2.5">
                      {p.resumoPublico}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Nota de privacidade */}
        <div className="flex items-start gap-3 border border-border rounded-xl px-4 py-3.5">
          <Lock className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            Por questões de privacidade e conformidade com a LGPD, informações pessoais como
            nome, unidade, CPF e dados individualizados de notificações e multas não são
            exibidas nesta página. Apenas dados agregados e processos públicos são apresentados.
          </p>
        </div>
      </div>
    </div>
  );
}
