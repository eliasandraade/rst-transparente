export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData } from "@/lib/utils";
import DemandaFiltros from "@/components/admin/DemandaFiltros";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { DemandStatus, DemandCategory } from "@prisma/client";
import { ClipboardList } from "lucide-react";

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

const STATUS_BADGE: Record<DemandStatus, string> = {
  RECEBIDA: "badge badge-neutral",
  EM_ANALISE: "badge badge-warning",
  EM_ANDAMENTO: "badge badge-warning",
  RESOLVIDA: "badge badge-success",
  ENCERRADA_SEM_ACAO: "badge badge-neutral",
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
  const status = rawStatus && VALID_STATUSES.includes(rawStatus as DemandStatus)
    ? (rawStatus as DemandStatus)
    : undefined;
  const category = rawCategory && VALID_CATEGORIES.includes(rawCategory as DemandCategory)
    ? (rawCategory as DemandCategory)
    : undefined;

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

  const filtrosAtivos = !!(status || category || search);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
            Administração
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Central de Demandas
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            <span className="font-semibold text-foreground tabular-nums">{demands.length}</span>{" "}
            demanda{demands.length !== 1 ? "s" : ""}
            {" · "}
            <span className="font-semibold text-foreground tabular-nums">{abertas}</span>{" "}
            em aberto
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <DemandaFiltros />
      </Suspense>

      {demands.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-5 h-5 text-[var(--foreground-subtle)]" aria-hidden="true" />
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            {filtrosAtivos
              ? "Nenhuma demanda encontrada com esses filtros."
              : "Nenhuma demanda recebida ainda."}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-raised)] border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Protocolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden sm:table-cell">Unidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden lg:table-cell">Aberta em</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demands.map((demand) => (
                <tr key={demand.id} className="hover:bg-[var(--surface-raised)] transition-colors duration-100">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary text-xs tabular-nums">
                      {demand.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[var(--foreground-muted)] text-xs">
                    {demand.unit}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-1 font-medium text-foreground">{demand.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--foreground-muted)]">
                    {CATEGORY_LABEL[demand.category]}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--foreground-muted)] tabular-nums whitespace-nowrap">
                    {formatarData(demand.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[demand.status]}>
                      {STATUS_LABEL[demand.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/demandas/${demand.id}`}
                      className="btn btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                    >
                      Ver
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
