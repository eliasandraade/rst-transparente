import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, formatarPeriodo, periodoAtual } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { TrendingUp, FileText, PlusCircle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Painel" };

async function getDashboardData() {
  const periodo = periodoAtual();

  const [totalLancamentos, totalPublicados, totalPareceres, lancamentosHoje] =
    await Promise.all([
      prisma.lancamento.count({ where: { periodo } }),
      prisma.lancamento.count({ where: { periodo, status: "PUBLICADO" } }),
      prisma.parecer.count({ where: { status: "PUBLICADO" } }),
      prisma.lancamento.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

  const totaisFinanceiros = await prisma.lancamento.groupBy({
    by: ["tipo"],
    where: { periodo, status: "PUBLICADO" },
    _sum: { valor: true },
  });

  const receitaTotal =
    Number(
      totaisFinanceiros.find((t) => t.tipo === "RECEITA")?._sum.valor ?? 0
    );
  const despesaTotal =
    Number(
      totaisFinanceiros.find((t) => t.tipo === "DESPESA")?._sum.valor ?? 0
    );

  return {
    periodo,
    totalLancamentos,
    totalPublicados,
    totalPareceres,
    lancamentosHoje,
    receitaTotal,
    despesaTotal,
    saldo: receitaTotal - despesaTotal,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const dados = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {session?.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Painel do Portal da Transparência — período atual:{" "}
          <strong>{formatarPeriodo(dados.periodo)}</strong>
        </p>
      </div>

      {/* KPIs do período */}
      <section aria-label="Resumo do período atual">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Resumo — {formatarPeriodo(dados.periodo)}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-muted-foreground">Receita total</p>
            <p className="text-xl font-bold text-green-700 mt-1">
              {formatarMoeda(dados.receitaTotal)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Despesa total</p>
            <p className="text-xl font-bold text-red-700 mt-1">
              {formatarMoeda(dados.despesaTotal)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p
              className={`text-xl font-bold mt-1 ${
                dados.saldo >= 0 ? "text-primary" : "text-red-700"
              }`}
            >
              {formatarMoeda(dados.saldo)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Lançamentos</p>
            <p className="text-xl font-bold mt-1">
              {dados.totalPublicados}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                publicados
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Ações rápidas */}
      <section aria-label="Ações rápidas">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Ações rápidas
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/lancamentos/novo"
            className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow border-2 border-transparent hover:border-primary/30 group min-h-[auto]"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <PlusCircle
                className="w-5 h-5 text-primary"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Novo lançamento
              </p>
              <p className="text-xs text-muted-foreground">
                Cadastrar receita ou despesa
              </p>
            </div>
          </Link>

          <Link
            href="/admin/lancamentos"
            className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow border-2 border-transparent hover:border-primary/30 group min-h-[auto]"
          >
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Gerenciar lançamentos
              </p>
              <p className="text-xs text-muted-foreground">
                {dados.totalLancamentos} no período atual
              </p>
            </div>
          </Link>

          <Link
            href="/admin/pareceres"
            className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow border-2 border-transparent hover:border-primary/30 group min-h-[auto]"
          >
            <div className="w-10 h-10 bg-warning-light rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-yellow-700" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Pareceres
              </p>
              <p className="text-xs text-muted-foreground">
                {dados.totalPareceres} publicado
                {dados.totalPareceres !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Status */}
      {dados.totalLancamentos > dados.totalPublicados && (
        <div className="flex items-start gap-3 bg-warning-light border border-warning/30 rounded-lg p-4">
          <CheckCircle2
            className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-yellow-800">
              {dados.totalLancamentos - dados.totalPublicados} lançamento
              {dados.totalLancamentos - dados.totalPublicados !== 1
                ? "s"
                : ""}{" "}
              em rascunho
            </p>
            <p className="text-sm text-yellow-700 mt-0.5">
              Esses lançamentos ainda não estão visíveis no portal público.{" "}
              <Link
                href="/admin/lancamentos"
                className="underline font-medium min-h-[auto]"
              >
                Gerenciar
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
