export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarPeriodo, periodoAtual } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  FileCheck,
  ArrowRight,
  Info,
} from "lucide-react";

const secoes = [
  {
    href: "/financeiro",
    icone: TrendingUp,
    titulo: "Receitas e Despesas",
    descricao:
      "Veja todas as entradas e saídas financeiras do condomínio, organizadas por categoria e período.",
    cor: "bg-success-light text-green-700",
    borda: "hover:border-success",
  },
  {
    href: "/metricas",
    icone: BarChart3,
    titulo: "Painel de Métricas",
    descricao:
      "Resumo visual da saúde financeira: receita total, despesas, saldo e evolução mensal.",
    cor: "bg-primary/10 text-primary",
    borda: "hover:border-primary",
  },
  {
    href: "/parecer",
    icone: FileCheck,
    titulo: "Parecer do Conselho Fiscal",
    descricao:
      "Leia o parecer oficial do Conselho Fiscal e faça o download do documento assinado.",
    cor: "bg-warning-light text-yellow-700",
    borda: "hover:border-warning",
  },
];

async function getUltimoPeriodo(): Promise<string> {
  const ultimo = await prisma.lancamento.findFirst({
    where: { status: "PUBLICADO" },
    orderBy: { periodo: "desc" },
    select: { periodo: true },
  });
  return ultimo?.periodo ?? periodoAtual();
}

export default async function HomePage() {
  const ultimoPeriodo = await getUltimoPeriodo();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Cabeçalho institucional */}
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Portal da Transparência
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Acompanhe as finanças do{" "}
          <strong className="text-foreground">
            Condomínio Residencial Santíssima Trindade
          </strong>{" "}
          com clareza e facilidade.
        </p>

        {/* Badge de período ativo */}
        <div className="inline-flex items-center gap-2 mt-5 bg-white border border-border rounded-full px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <Info className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>
            Dados disponíveis até:{" "}
            <strong className="text-foreground">
              {formatarPeriodo(ultimoPeriodo)}
            </strong>
          </span>
        </div>
      </div>

      {/* Cards de navegação */}
      <nav aria-label="Seções do portal">
        <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3" role="list">
          {secoes.map(({ href, icone: Icone, titulo, descricao, cor, borda }) => (
            <li key={href}>
              <Link
                href={href}
                className={`card flex flex-col gap-4 transition-all duration-200 min-h-[auto]
                  border-2 border-transparent ${borda} hover:shadow-card-hover group`}
                aria-label={`Acessar seção: ${titulo}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${cor}`}
                  aria-hidden="true"
                >
                  <Icone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {titulo}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {descricao}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 text-sm font-medium text-primary"
                  aria-hidden="true"
                >
                  Acessar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Aviso institucional */}
      <div className="mt-10 sm:mt-14 border border-border rounded-lg bg-white p-5 text-sm text-muted-foreground text-center">
        <p>
          As informações apresentadas neste portal são de responsabilidade do{" "}
          <strong className="text-foreground">Conselho Fiscal</strong> do
          Condomínio Residencial Santíssima Trindade.
        </p>
      </div>
    </div>
  );
}
