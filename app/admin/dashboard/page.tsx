export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, formatarPeriodo, periodoAtual } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TrendingUp, FileText, PlusCircle, AlertTriangle,
  ClipboardList, ArrowRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Painel" };

async function getDashboardData() {
  const periodo = periodoAtual();

  const [totalLancamentos, totalPublicados, totalPareceres, demandasAbertas] =
    await Promise.all([
      prisma.lancamento.count({ where: { periodo } }),
      prisma.lancamento.count({ where: { periodo, status: "PUBLICADO" } }),
      prisma.parecer.count({ where: { status: "PUBLICADO" } }),
      prisma.demand.count({
        where: { status: { notIn: ["RESOLVIDA", "ENCERRADA_SEM_ACAO"] } },
      }),
    ]);

  const totaisFinanceiros = await prisma.lancamento.groupBy({
    by: ["tipo"],
    where: { periodo, status: "PUBLICADO" },
    _sum: { valor: true },
  });

  const receitaTotal = Number(
    totaisFinanceiros.find((t) => t.tipo === "RECEITA")?._sum.valor ?? 0
  );
  const despesaTotal = Number(
    totaisFinanceiros.find((t) => t.tipo === "DESPESA")?._sum.valor ?? 0
  );

  return {
    periodo,
    totalLancamentos,
    totalPublicados,
    totalPareceres,
    receitaTotal,
    despesaTotal,
    saldo: receitaTotal - despesaTotal,
    rascunhos: totalLancamentos - totalPublicados,
    demandasAbertas,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const dados = await getDashboardData();
  const primeiroNome = session?.user.name?.split(" ")[0] ?? "Administrador";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Boas-vindas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
          Painel administrativo
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Olá, {primeiroNome}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Período atual:{" "}
          <span className="font-semibold text-foreground">{formatarPeriodo(dados.periodo)}</span>
        </p>
      </div>

      {/* KPIs financeiros */}
      <section aria-label="Resumo financeiro do período">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] flex-shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Financeiro — {formatarPeriodo(dados.periodo)}
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card py-4">
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Receita</p>
            <p className="text-lg font-bold text-[var(--success)] tabular-nums">
              {formatarMoeda(dados.receitaTotal)}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Despesa</p>
            <p className="text-lg font-bold text-[var(--danger)] tabular-nums">
              {formatarMoeda(dados.despesaTotal)}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Saldo</p>
            <p
              className={`text-lg font-bold tabular-nums ${
                dados.saldo >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {formatarMoeda(dados.saldo)}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-[var(--foreground-muted)] mb-1">Publicados</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {dados.totalPublicados}
              <span className="text-xs font-normal text-[var(--foreground-muted)] ml-1">
                / {dados.totalLancamentos}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Alerta de rascunhos */}
      {dados.rascunhos > 0 && (
        <div className="flex items-start gap-3 bg-[var(--warning-subtle)] border border-border rounded-lg px-4 py-3.5">
          <AlertTriangle
            className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {dados.rascunhos} lançamento{dados.rascunhos !== 1 ? "s" : ""} em rascunho
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              Ainda não visíveis no portal público.{" "}
              <Link href="/admin/lancamentos" className="underline font-medium hover:text-foreground">
                Gerenciar
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <section aria-label="Ações rápidas">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Ações rápidas
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/admin/lancamentos/novo"
            className="card flex items-center gap-3 hover:border-primary/40 hover:bg-[var(--primary-subtle)] group transition-colors duration-150 min-h-[auto] p-4"
          >
            <div className="w-9 h-9 bg-[var(--primary-subtle)] group-hover:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
              <PlusCircle className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Novo lançamento
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">Receita ou despesa</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-subtle)] group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </Link>

          <Link
            href="/admin/lancamentos"
            className="card flex items-center gap-3 hover:border-primary/40 hover:bg-[var(--primary-subtle)] group transition-colors duration-150 min-h-[auto] p-4"
          >
            <div className="w-9 h-9 bg-[var(--surface-raised)] group-hover:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
              <TrendingUp className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-primary transition-colors" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Lançamentos
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {dados.totalLancamentos} no período
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-subtle)] group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </Link>

          <Link
            href="/admin/pareceres"
            className="card flex items-center gap-3 hover:border-primary/40 hover:bg-[var(--primary-subtle)] group transition-colors duration-150 min-h-[auto] p-4"
          >
            <div className="w-9 h-9 bg-[var(--warning-subtle)] group-hover:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
              <FileText className="w-4 h-4 text-[var(--warning)] group-hover:text-primary transition-colors" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Pareceres
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {dados.totalPareceres} publicado{dados.totalPareceres !== 1 ? "s" : ""}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-subtle)] group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </Link>

          <Link
            href="/admin/demandas"
            className="card flex items-center gap-3 hover:border-primary/40 hover:bg-[var(--primary-subtle)] group transition-colors duration-150 min-h-[auto] p-4"
          >
            <div className="w-9 h-9 bg-[var(--surface-raised)] group-hover:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
              <ClipboardList className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-primary transition-colors" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Demandas
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {dados.demandasAbertas} em aberto
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--foreground-subtle)] group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
