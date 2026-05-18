export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarPeriodo, periodoAtual } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  FileCheck,
  Building2,
  MessageSquareDot,
  ArrowRight,
  CalendarDays,
  Vote,
} from "lucide-react";
import EnqueteCard from "@/components/public/EnqueteCard";

/* ─── Data fetching ─────────────────────────────────────────────────────── */

async function getEnquetesAtivas() {
  const agora = new Date();
  const enquetes = await prisma.enquete.findMany({
    where: {
      status: "PUBLICADO",
      OR: [{ dataFim: null }, { dataFim: { gt: agora } }],
    },
    include: {
      opcoes: {
        orderBy: { ordem: "asc" },
        include: { votos: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return enquetes.map((enquete) => {
    const opcoes = enquete.opcoes.map((o) => ({
      id: o.id,
      texto: o.texto,
      ordem: o.ordem,
      totalVotos: o.votos.length,
    }));
    const totalVotos = opcoes.reduce((acc, o) => acc + o.totalVotos, 0);
    return {
      id: enquete.id,
      pergunta: enquete.pergunta,
      tipo: enquete.tipo as "UNICA" | "MULTIPLA",
      dataFim: enquete.dataFim ? enquete.dataFim.toISOString() : null,
      opcoes,
      totalVotos,
    };
  });
}

async function getUltimoPeriodo(): Promise<string> {
  const ultimo = await prisma.lancamento.findFirst({
    where: { status: "PUBLICADO" },
    orderBy: { periodo: "desc" },
    select: { periodo: true },
  });
  return ultimo?.periodo ?? periodoAtual();
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const [ultimoPeriodo, enquetesAtivas] = await Promise.all([
    getUltimoPeriodo(),
    getEnquetesAtivas(),
  ]);

  return (
    <div className="animate-page-enter">

      {/* ── Hero institucional ─────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)] mb-3">
              Condomínio Residencial Santíssima Trindade
            </p>
            <h1 className="text-3xl sm:text-[2.25rem] font-bold text-foreground tracking-tight leading-[1.15] mb-4">
              Portal da Transparência
            </h1>
            <p className="text-[var(--foreground-muted)] text-lg leading-relaxed mb-6">
              Finanças, gestão e prestação de contas do condomínio — organizados
              com clareza para todos os moradores.
            </p>
            <div className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-border rounded-full px-3.5 py-1.5">
              <CalendarDays
                className="w-3.5 h-3.5 text-[var(--foreground-subtle)] flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs text-[var(--foreground-muted)]">
                Período atual:{" "}
                <strong className="text-foreground font-semibold">
                  {formatarPeriodo(ultimoPeriodo)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navegação principal ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav aria-label="Seções do portal">

          {/* Linha 1: Financeiro (destaque) + Métricas + Parecer */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

            {/* Card destaque — Receitas e Despesas */}
            <Link
              href="/financeiro"
              className="card-interactive group lg:col-span-3 flex flex-col gap-5 p-6 sm:p-7"
              aria-label="Acessar Receitas e Despesas"
              style={{ minHeight: "auto" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  Financeiro
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-start gap-2 mb-2.5">
                  <TrendingUp
                    className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-bold text-foreground tracking-tight leading-snug">
                    Receitas e Despesas
                  </h2>
                </div>
                <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                  Veja todas as entradas e saídas financeiras do condomínio,
                  organizadas por categoria e período. Dados lançados e
                  validados pelo Conselho Fiscal.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all duration-150">
                Ver lançamentos
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </Link>

            {/* Stack direita: Métricas + Parecer */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Métricas */}
              <Link
                href="/metricas"
                className="card-interactive group flex-1 flex flex-col gap-4 p-5"
                aria-label="Acessar Painel de Métricas"
                style={{ minHeight: "auto" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Métricas
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <h2 className="text-base font-bold text-foreground tracking-tight leading-snug">
                      Painel de Métricas
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    KPIs e evolução financeira em gráficos claros.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2 transition-all duration-150">
                  Ver métricas
                  <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>

              {/* Parecer */}
              <Link
                href="/parecer"
                className="card-interactive group flex-1 flex flex-col gap-4 p-5"
                aria-label="Acessar Parecer do Conselho Fiscal"
                style={{ minHeight: "auto" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-warning">
                    Conselho Fiscal
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <FileCheck className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <h2 className="text-base font-bold text-foreground tracking-tight leading-snug">
                      Parecer Oficial
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    Leia e baixe o parecer assinado do Conselho.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2 transition-all duration-150">
                  Ver parecer
                  <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>

            </div>
          </div>

          {/* Linha 2: Gestão + Central de Demandas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Gestão */}
            <Link
              href="/gestao"
              className="card-interactive group flex flex-col gap-4 p-5"
              aria-label="Acessar Gestão do Condomínio"
              style={{ minHeight: "auto" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Gestão
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight mb-1.5">
                    Gestão do Condomínio
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    Obras, propostas, membros do Conselho e documentos da gestão condominial.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2 transition-all duration-150">
                Ver gestão
                <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </Link>

            {/* Central de Demandas */}
            <Link
              href="/demandas"
              className="card-interactive group flex flex-col gap-4 p-5"
              aria-label="Acessar Central de Demandas"
              style={{ minHeight: "auto" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Demandas
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquareDot className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight mb-1.5">
                    Central de Demandas
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    Registre solicitações, sugestões ou reclamações e acompanhe o andamento pelo protocolo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2 transition-all duration-150">
                Abrir demanda
                <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </Link>

          </div>
        </nav>

        {/* ── Enquetes ativo ──────────────────────────────────────────── */}
        {enquetesAtivas.length > 0 && (
          <section className="mt-10 sm:mt-12" aria-label="Enquetes ativas">
            <div className="flex items-center gap-2.5 mb-5">
              <Vote className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Enquetes
              </h2>
              <span className="badge badge-primary ml-0.5">
                {enquetesAtivas.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {enquetesAtivas.map((enquete) => (
                <EnqueteCard key={enquete.id} enquete={enquete} />
              ))}
            </div>
          </section>
        )}

        {/* ── Disclaimer institucional ────────────────────────────────── */}
        <div className="mt-10 sm:mt-12 pt-8 border-t border-border">
          <p className="text-xs text-[var(--foreground-subtle)] text-center leading-relaxed">
            As informações apresentadas neste portal são de responsabilidade do{" "}
            <strong className="text-[var(--foreground-muted)] font-medium">
              Conselho Fiscal
            </strong>{" "}
            do Condomínio Residencial Santíssima Trindade.
          </p>
        </div>
      </div>

    </div>
  );
}
