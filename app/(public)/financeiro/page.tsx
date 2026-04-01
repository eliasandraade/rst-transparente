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

  const totalReceitas = receitas.reduce(
    (acc, l) => acc + Number(l.valor),
    0
  );
  const totalDespesas = despesas.reduce(
    (acc, l) => acc + Number(l.valor),
    0
  );

  // Busca todos os períodos com dados publicados para o filtro
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
  const periodo = params.periodo ?? await getUltimoPeriodoPublicado();
  const dados = await getDadosFinanceiros(periodo);

  const temDados =
    dados.receitas.length > 0 || dados.despesas.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Receitas e Despesas</h1>
        <p className="text-muted-foreground text-lg">
          Todos os lançamentos financeiros do condomínio, por período.
        </p>
      </div>

      {/* Filtro de período */}
      <div className="card mb-6">
        <Suspense fallback={null}>
          <FiltroPeriodo
            periodoAtivo={periodo}
            periodosDisponiveis={dados.periodosDisponiveis}
          />
        </Suspense>
      </div>

      {/* KPIs do período */}
      {temDados && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          aria-label={`Resumo financeiro de ${formatarPeriodo(periodo)}`}
        >
          <div className="card border-l-4 border-l-success">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />
              Receita Total
            </div>
            <p className="text-2xl font-bold text-green-700">
              {formatarMoeda(dados.totalReceitas)}
            </p>
          </div>
          <div className="card border-l-4 border-l-danger">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" aria-hidden="true" />
              Despesa Total
            </div>
            <p className="text-2xl font-bold text-red-700">
              {formatarMoeda(dados.totalDespesas)}
            </p>
          </div>
          <div className="card border-l-4 border-l-primary">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Scale className="w-4 h-4 text-primary" aria-hidden="true" />
              Saldo do Período
            </div>
            <p
              className={`text-2xl font-bold ${
                dados.saldo >= 0 ? "text-primary" : "text-red-700"
              }`}
            >
              {formatarMoeda(dados.saldo)}
            </p>
          </div>
        </div>
      )}

      {/* Período selecionado */}
      <p className="text-sm text-muted-foreground mb-6">
        Exibindo lançamentos de:{" "}
        <strong className="text-foreground">{formatarPeriodo(periodo)}</strong>
      </p>

      {/* Tabelas */}
      {!temDados ? (
        <div className="card text-center py-16">
          <p className="text-muted-foreground text-lg mb-2">
            Nenhum dado publicado para este período.
          </p>
          <p className="text-sm text-muted-foreground">
            Tente selecionar outro período no filtro acima.
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
  );
}
