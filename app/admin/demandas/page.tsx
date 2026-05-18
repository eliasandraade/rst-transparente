export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData } from "@/lib/utils";
import DemandaFiltros from "@/components/admin/DemandaFiltros";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { DemandStatus, DemandCategory } from "@prisma/client";

export const metadata: Metadata = { title: "Central de Demandas" };

const VALID_STATUSES = ["RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ENCERRADA_SEM_ACAO"] as const;
const VALID_CATEGORIES = ["MANUTENCAO", "SEGURANCA", "LIMPEZA", "FINANCEIRO", "BARULHO", "ILUMINACAO", "VAZAMENTO", "SUGESTAO", "RECLAMACAO", "OUTROS"] as const;

const STATUS_LABEL: Record<DemandStatus, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ENCERRADA_SEM_ACAO: "Encerrada sem ação",
};

const STATUS_CLASS: Record<DemandStatus, string> = {
  RECEBIDA: "bg-blue-100 text-blue-700",
  EM_ANALISE: "bg-yellow-100 text-yellow-700",
  EM_ANDAMENTO: "bg-purple-100 text-purple-700",
  RESOLVIDA: "bg-green-100 text-green-700",
  ENCERRADA_SEM_ACAO: "bg-gray-100 text-gray-500",
};

const CATEGORY_LABEL: Record<DemandCategory, string> = {
  MANUTENCAO: "Manutenção", SEGURANCA: "Segurança", LIMPEZA: "Limpeza",
  FINANCEIRO: "Financeiro", BARULHO: "Barulho", ILUMINACAO: "Iluminação",
  VAZAMENTO: "Vazamento", SUGESTAO: "Sugestão", RECLAMACAO: "Reclamação",
  OUTROS: "Outros",
};

interface Props {
  searchParams: Promise<{
    status?: string;
    category?: string;
    search?: string;
  }>;
}

export default async function AdminDemandasPage({ searchParams }: Props) {
  const { status: rawStatus, category: rawCategory, search } = await searchParams;
  const status = rawStatus && VALID_STATUSES.includes(rawStatus as DemandStatus) ? (rawStatus as DemandStatus) : undefined;
  const category = rawCategory && VALID_CATEGORIES.includes(rawCategory as DemandCategory) ? (rawCategory as DemandCategory) : undefined;

  const demands = await prisma.demand.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { protocol: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const abertas = demands.filter(
    (d) => d.status !== "RESOLVIDA" && d.status !== "ENCERRADA_SEM_ACAO"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Central de Demandas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {demands.length} demanda{demands.length !== 1 ? "s" : ""} ·{" "}
            {abertas} em aberto
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <DemandaFiltros />
      </Suspense>

      {demands.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">
            {search || status || category
              ? "Nenhuma demanda encontrada com esses filtros."
              : "Nenhuma demanda recebida ainda."}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Protocolo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Unidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Aberta em</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => (
                <tr key={demand.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary text-xs">{demand.protocol}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{demand.unit}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-1 font-medium">{demand.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{CATEGORY_LABEL[demand.category]}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground whitespace-nowrap">{formatarData(demand.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_CLASS[demand.status]}`}>
                      {STATUS_LABEL[demand.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/demandas/${demand.id}`} className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
