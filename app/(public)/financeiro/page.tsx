export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { periodoAtual, formatarMoeda, formatarPeriodo } from "@/lib/utils";
import LancamentosTable from "@/components/public/LancamentosTable";
import FiltroPeriodo from "@/components/public/FiltrodePeriodo";
import type { LancamentoComCategoria } from "@/types";
import type { Metadata } from "next";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Receitas e Despesas",
  description:
    "Veja todas as receitas e despesas do Condomínio Residencial Santíssima Trindade por período.",
};

interface Props {
  searchParams: Promise<{ periodo?: string }>;
}

async function getDadosFinanceiros(periodo: string) {
  const lancamentos = await prisma.lancamento.findMany({
    where: { periodo, status: "PUBLICADO" },
    include: { categoria: { select: { id: true, nome: true, cor: true } } },
    orderBy: [{ tipo: "asc" }, { data: "asc" }],
  });

  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");

  const totalReceitas = receitas.reduce((acc, l) => acc + Number(l.valor), 0);
  const totalDespesas = despesas.reduce((acc, l) => acc + Number(l.valor), 0);

  const periodosComDados = await prisma.lancamento.findMany({
    where: { status: "PUBLICADO" },
    select: { periodo: true },
    distinct: ["periodo"],
    orderBy: { periodo: "desc" },
  });

  return {
    receitas: receitas as unknown as LancamentoComCategoria[],
    despesas: despesas as unknown as LancamentoComCategoria[],
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    periodosDisponiveis: periodosComDados.map((p) => p.periodo),
  };
}

async function getUltimoPeriodoPublicado(): Promise<string> {
  const ultimo = await prisma.lancamento.findFirst({
    where: { status: "PUBLICADO" },
    orderBy: { periodo: "desc" },
    select: { periodo: true },
  });
  return ultimo?.periodo ?? periodoAtual();
}

export default async function FinanceiroPage({ searchParams }: Props) {
  const params = await searchParams;
  const periodo = params.periodo ?? (await getUltimoPeriodoPublicado());
  const dados = await getDadosFinanceiros(periodo);

  const temDados = dados.receitas.length > 0 || dados.despesas.length > 0;
  const saldoPositivo = dados.saldo >= 0;

  return (
    <div className="animate-page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  Financeiro
                </span>
              </div>
              <h1 className="text-2xl sm:text-[1.875rem] font-bold text-foreground tracking-tight leading-tight">
                Receitas e Despesas
              </h1>
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mt-2 max-w-lg">
                Lançamentos financeiros do condomínio, validados e publicados
                pelo Conselho Fiscal.
              </p>
            </div>

            {/* Filtro de período */}
            <div className="flex-shrink-0">
              <Suspense fallback={null}>
                <FiltroPeriodo
                  periodoAtivo={periodo}
                  periodosDisponiveis={dados.periodosDisponiveis}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── Conteúdo ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* KPIs */}
        {temDados && (
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            aria-label={`Resumo financeiro de ${formatarPeriodo(periodo)}`}
          >
            {/* Receita */}
            <div className="card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-success">
                    Receita
                  </span>
                </div>
                <TrendingUp className="w-4 h-4 text-[var(--success)] flex-shrink-0" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Receita Total
                </p>
                <p
                  className="text-2xl font-bold tracking-tight tabular-nums text-[var(--success)]"
                  aria-label={`Receita total: ${formatarMoeda(dados.totalReceitas)}`}
                >
                  {formatarMoeda(dados.totalReceitas)}
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-1.5">
                  {dados.receitas.length} lançamento{dados.receitas.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Despesa */}
            <div className="card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-danger">
                    Despesa
                  </span>
                </div>
                <TrendingDown className="w-4 h-4 text-[var(--danger)] flex-shrink-0" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Despesa Total
                </p>
                <p
                  className="text-2xl font-bold tracking-tight tabular-nums text-[var(--danger)]"
                  aria-label={`Despesa total: ${formatarMoeda(dados.totalDespesas)}`}
                >
                  {formatarMoeda(dados.totalDespesas)}
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-1.5">
                  {dados.despesas.length} lançamento{dados.despesas.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Saldo */}
            <div className="card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className={`flex items-center gap-1.5`}>
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${saldoPositivo ? "bg-primary" : "bg-danger"}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${saldoPositivo ? "text-primary" : "text-danger"}`}
                  >
                    Saldo
                  </span>
                </div>
                <Scale
                  className={`w-4 h-4 flex-shrink-0 ${saldoPositivo ? "text-[var(--primary)]" : "text-[var(--danger)]"}`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Saldo do Período
                </p>
                <p
                  className={`text-2xl font-bold tracking-tight tabular-nums ${saldoPositivo ? "text-[var(--primary)]" : "text-[var(--danger)]"}`}
                  aria-label={`Saldo do período: ${formatarMoeda(dados.saldo)}`}
                >
                  {formatarMoeda(dados.saldo)}
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-1.5">
                  {formatarPeriodo(periodo)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabelas */}
        {!temDados ? (
          <div className="card text-center py-16">
            <p className="text-[var(--foreground-muted)] text-base mb-2">
              Nenhum dado publicado para este período.
            </p>
            <p className="text-sm text-[var(--foreground-subtle)]">
              Selecione outro período no filtro acima.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <LancamentosTable
              lancamentos={dados.receitas}
              tipo="RECEITA"
              total={dados.totalReceitas}
            />
            <LancamentosTable
              lancamentos={dados.despesas}
              tipo="DESPESA"
              total={dados.totalDespesas}
            />
          </div>
        )}

      </div>
    </div>
  );
}
