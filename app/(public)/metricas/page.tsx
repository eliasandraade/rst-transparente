export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { periodoAtual, formatarPeriodo, formatarMoeda } from "@/lib/utils";
import KPICard from "@/components/public/KPICard";
import GraficoCategoria from "@/components/public/GraficoCategoria";
import GraficoEvolucao from "@/components/public/GraficoEvolucao";
import FiltroPeriodo from "@/components/public/FiltrodePeriodo";
import type { MetricasPeriodo } from "@/types";
import type { Metadata } from "next";
import { TrendingUp, TrendingDown, Scale, BarChart3, CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Painel de Métricas",
  description:
    "Resumo visual da saúde financeira do Condomínio Residencial Santíssima Trindade.",
};

interface Props {
  searchParams: Promise<{ periodo?: string }>;
}

async function getMetricas(periodo: string): Promise<MetricasPeriodo> {
  const lancamentos = await prisma.lancamento.findMany({
    where: { periodo, status: "PUBLICADO" },
    include: { categoria: true },
  });

  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");

  const receitaTotal = receitas.reduce((acc, l) => acc + Number(l.valor), 0);
  const despesaTotal = despesas.reduce((acc, l) => acc + Number(l.valor), 0);

  const porCategoria = new Map<
    string,
    { nome: string; cor: string; total: number }
  >();
  for (const l of despesas) {
    const existente = porCategoria.get(l.categoriaId);
    if (existente) {
      existente.total += Number(l.valor);
    } else {
      porCategoria.set(l.categoriaId, {
        nome: l.categoria.nome,
        cor: l.categoria.cor,
        total: Number(l.valor),
      });
    }
  }

  const despesasPorCategoria = Array.from(porCategoria.entries())
    .map(([id, { nome, cor, total }]) => ({
      categoriaId: id,
      categoriaNome: nome,
      categoriaCor: cor,
      total,
      percentual: despesaTotal > 0 ? (total / despesaTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const [ano, mes] = periodo.split("-").map(Number);
  const periodosUltimos6: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1);
    const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    periodosUltimos6.push(p);
  }

  const dadosHistoricos = await prisma.lancamento.groupBy({
    by: ["periodo", "tipo"],
    where: {
      periodo: { in: periodosUltimos6 },
      status: "PUBLICADO",
    },
    _sum: { valor: true },
  });

  const evolucaoMensal = periodosUltimos6.map((p) => {
    const r = dadosHistoricos.find((d) => d.periodo === p && d.tipo === "RECEITA");
    const d = dadosHistoricos.find((d) => d.periodo === p && d.tipo === "DESPESA");
    const receita = Number(r?._sum.valor ?? 0);
    const despesa = Number(d?._sum.valor ?? 0);
    return { periodo: p, receita, despesa, saldo: receita - despesa };
  });

  return {
    periodo,
    receitaTotal,
    despesaTotal,
    saldo: receitaTotal - despesaTotal,
    despesasPorCategoria,
    evolucaoMensal,
  };
}

export default async function MetricasPage({ searchParams }: Props) {
  const params = await searchParams;

  const ultimoPublicado = await prisma.lancamento.findFirst({
    where: { status: "PUBLICADO" },
    orderBy: { periodo: "desc" },
    select: { periodo: true },
  });
  const periodo = params.periodo ?? ultimoPublicado?.periodo ?? periodoAtual();
  const metricas = await getMetricas(periodo);

  const periodosDisponiveis = await prisma.lancamento
    .findMany({
      where: { status: "PUBLICADO" },
      select: { periodo: true },
      distinct: ["periodo"],
      orderBy: { periodo: "desc" },
    })
    .then((r) => r.map((p) => p.periodo));

  const temDados = metricas.receitaTotal > 0 || metricas.despesaTotal > 0;
  const saldoPositivo = metricas.saldo >= 0;
  const comprometimento =
    metricas.receitaTotal > 0
      ? (metricas.despesaTotal / metricas.receitaTotal) * 100
      : 0;

  return (
    <div className="animate-page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Métricas
                </span>
              </div>
              <h1 className="text-2xl sm:text-[1.875rem] font-bold text-foreground tracking-tight leading-tight">
                Painel de Métricas
              </h1>
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mt-2 max-w-lg">
                Resumo visual da saúde financeira do condomínio por período.
              </p>
            </div>

            {/* Filtro de período */}
            <div className="flex-shrink-0">
              <Suspense fallback={null}>
                <FiltroPeriodo
                  periodoAtivo={periodo}
                  periodosDisponiveis={periodosDisponiveis}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── Conteúdo ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {!temDados ? (
          <div className="card text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-[var(--foreground-subtle)]" aria-hidden="true" />
            </div>
            <p className="text-[var(--foreground-muted)] text-base mb-1.5">
              Nenhum dado publicado para {formatarPeriodo(periodo)}.
            </p>
            <p className="text-sm text-[var(--foreground-subtle)]">
              Selecione outro período no filtro acima.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPIs ────────────────────────────────────────────────── */}
            <section aria-label={`Indicadores financeiros de ${formatarPeriodo(periodo)}`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-subtle)]">
                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>
                    Período:{" "}
                    <strong className="text-foreground font-semibold">
                      {formatarPeriodo(periodo)}
                    </strong>
                  </span>
                </div>
                {temDados && (
                  <span className="text-xs text-[var(--foreground-subtle)] tabular-nums">
                    {comprometimento.toFixed(1)}% das receitas comprometidas com despesas
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard
                  titulo="Receita Total"
                  valor={metricas.receitaTotal}
                  icone={TrendingUp}
                  variante="receita"
                  descricao="Total de entradas no período"
                />
                <KPICard
                  titulo="Despesa Total"
                  valor={metricas.despesaTotal}
                  icone={TrendingDown}
                  variante="despesa"
                  descricao="Total de saídas no período"
                />
                <KPICard
                  titulo="Saldo do Período"
                  valor={metricas.saldo}
                  icone={Scale}
                  variante={saldoPositivo ? "saldo" : "despesa"}
                  descricao={saldoPositivo ? "Resultado positivo" : "Resultado negativo"}
                />
              </div>
            </section>

            {/* ── Despesas por Categoria ──────────────────────────────── */}
            {metricas.despesasPorCategoria.length > 0 && (
              <section className="card" aria-label="Despesas por categoria">
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-danger">
                      Despesas
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                      Distribuição por Categoria
                    </h2>
                    <span className="text-sm font-semibold text-[var(--danger)] tabular-nums">
                      {formatarMoeda(metricas.despesaTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    {metricas.despesasPorCategoria.length} categorias em {formatarPeriodo(periodo)}
                  </p>
                </div>
                <GraficoCategoria dados={metricas.despesasPorCategoria} />
              </section>
            )}

            {/* ── Evolução Mensal ─────────────────────────────────────── */}
            <section className="card" aria-label="Evolução financeira mensal">
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Histórico
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Evolução Mensal
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Comparativo de receitas e despesas nos últimos 6 meses
                </p>
              </div>
              <GraficoEvolucao dados={metricas.evolucaoMensal} />
            </section>
          </>
        )}

      </div>
    </div>
  );
}
