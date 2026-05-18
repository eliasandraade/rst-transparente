export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarMoeda, formatarData } from "@/lib/utils";
import type { Metadata } from "next";
import {
  Building2,
  Wrench,
  CalendarRange,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Gestão do Condomínio",
  description:
    "Conheça e acompanhe as obras e melhorias em andamento no condomínio.",
};

/* ── helpers ─────────────────────────────────────────────────────────────── */

const statusConfig: Record<string, { label: string; badge: string }> = {
  PLANEJADO:    { label: "Planejado",    badge: "badge badge-neutral"  },
  EM_ANDAMENTO: { label: "Em andamento", badge: "badge badge-warning"  },
  CONCLUIDO:    { label: "Concluído",    badge: "badge badge-success"  },
  CANCELADO:    { label: "Cancelado",    badge: "badge badge-neutral"  },
};

function progressoColor(p: number): string {
  if (p <= 33) return "var(--danger)";
  if (p <= 66) return "var(--warning)";
  return "var(--success)";
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default async function GestaoPage() {
  const obras = await prisma.obra.findMany({
    where: { publicado: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-page-enter">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              Gestão
            </span>
          </div>
          <h1 className="text-2xl sm:text-[1.875rem] font-bold text-foreground tracking-tight leading-tight">
            Gestão do Condomínio
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mt-2 max-w-lg">
            Conheça e acompanhe as obras e melhorias em andamento no nosso condomínio.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">

        {/* ── Obras e Melhorias ─────────────────────────────────────────── */}
        <section aria-label="Obras e melhorias">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Obras e Melhorias
            </h2>
            {obras.length > 0 && (
              <span className="badge badge-neutral ml-0.5">{obras.length}</span>
            )}
          </div>

          {obras.length === 0 ? (
            <div className="card text-center py-12">
              <div
                className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3"
                aria-hidden="true"
              >
                <Building2 className="w-5 h-5 text-[var(--foreground-subtle)]" />
              </div>
              <p className="text-[var(--foreground-muted)] text-sm">
                Nenhuma obra publicada no momento.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {obras.map((obra) => {
                const cfg = statusConfig[obra.status] ?? statusConfig.PLANEJADO;
                return (
                  <article key={obra.id} className="card flex flex-col gap-4">
                    {/* Título + status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-foreground leading-snug">
                        {obra.titulo}
                      </h3>
                      <span className={`${cfg.badge} flex-shrink-0`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Descrição */}
                    {obra.descricao && (
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed -mt-1">
                        {obra.descricao}
                      </p>
                    )}

                    {/* Progresso */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[var(--foreground-subtle)]">Progresso</span>
                        <span className="font-semibold tabular-nums" style={{ color: progressoColor(obra.progresso) }}>
                          {obra.progresso}%
                        </span>
                      </div>
                      <div
                        className="w-full bg-[var(--surface-raised)] rounded-full h-1.5"
                        role="progressbar"
                        aria-valuenow={obra.progresso}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progresso da obra: ${obra.progresso}%`}
                      >
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${obra.progresso}%`,
                            backgroundColor: progressoColor(obra.progresso),
                          }}
                        />
                      </div>
                    </div>

                    {/* Financeiro + datas */}
                    {(obra.orcamento || obra.gasto || obra.dataInicio || obra.dataPrevista) && (
                      <div className="text-xs text-[var(--foreground-muted)] space-y-1 pt-3 border-t border-border">
                        {obra.orcamento && (
                          <div className="flex justify-between">
                            <span>Orçamento</span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {formatarMoeda(Number(obra.orcamento))}
                            </span>
                          </div>
                        )}
                        {obra.gasto && (
                          <div className="flex justify-between">
                            <span>Gasto até agora</span>
                            <span className="font-semibold text-[var(--danger)] tabular-nums">
                              {formatarMoeda(Number(obra.gasto))}
                            </span>
                          </div>
                        )}
                        {(obra.dataInicio || obra.dataPrevista) && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <CalendarRange className="w-3 h-3 flex-shrink-0 text-[var(--foreground-subtle)]" aria-hidden="true" />
                            <span>
                              {obra.dataInicio && formatarData(obra.dataInicio)}
                              {obra.dataInicio && obra.dataPrevista && " → "}
                              {obra.dataPrevista && formatarData(obra.dataPrevista)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
