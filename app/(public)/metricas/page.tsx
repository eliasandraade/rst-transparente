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
import { TrendingUp, TrendingDown, Scale, BarChart3 } from "lucide-react";

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

  // Despesas por categoria
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

  // Evolução dos últimos 6 meses
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

  // Períodos disponíveis para o filtro
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

  const temDados =
    metricas.receitaTotal > 0 || metricas.despesaTotal > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel de Métricas</h1>
        <p className="text-muted-foreground text-lg">
          Resumo visual da saúde financeira do condomínio.
        </p>
      </div>

      {/* Filtro */}
      <div className="card mb-6">
        <Suspense fallback={null}>
          <FiltroPeriodo
            periodoAtivo={periodo}
            periodosDisponiveis={periodosDisponiveis}
          />
        </Suspense>
      </div>

      {!temDados ? (
        <div className="card text-center py-16">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            Nenhum dado publicado para {formatarPeriodo(periodo)}.
          </p>
          <p className="text-sm text-muted-foreground">
            Tente selecionar outro período no filtro acima.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <section aria-label={`Indicadores financeiros de ${formatarPeriodo(periodo)}`}>
            <h2 className="text-xl font-semibold mb-4">
              Indicadores — {formatarPeriodo(periodo)}
            </h2>
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
                variante={metricas.saldo >= 0 ? "saldo" : "despesa"}
                descricao={
                  metricas.saldo >= 0
                    ? "Resultado positivo"
                    : "Resultado negativo"
                }
              />
            </div>
          </section>

          {/* Gráfico por categoria */}
          {metricas.despesasPorCategoria.length > 0 && (
            <section className="card" aria-label="Despesas por categoria">
              <h2 className="text-xl font-semibold mb-1">
                Despesas por Categoria
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Distribuição das despesas de {formatarPeriodo(periodo)} por
                categoria. Total:{" "}
                <strong>{formatarMoeda(metricas.despesaTotal)}</strong>
              </p>
              <GraficoCategoria dados={metricas.despesasPorCategoria} />
            </section>
          )}

          {/* Evolução mensal */}
          <section className="card" aria-label="Evolução financeira mensal">
            <h2 className="text-xl font-semibold mb-1">Evolução Mensal</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Comparativo de receitas e despesas nos últimos 6 meses.
            </p>
            <GraficoEvolucao dados={metricas.evolucaoMensal} />
          </section>
        </div>
      )}
    </div>
  );
}
