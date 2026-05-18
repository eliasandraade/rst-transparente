import { formatarMoeda, formatarData } from "@/lib/utils";
import type { LancamentoComCategoria } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LancamentosTableProps {
  lancamentos: LancamentoComCategoria[];
  tipo: "RECEITA" | "DESPESA";
  total: number;
}

export default function LancamentosTable({
  lancamentos,
  tipo,
  total,
}: LancamentosTableProps) {
  const isReceita = tipo === "RECEITA";
  const titulo = isReceita ? "Receitas" : "Despesas";
  const corClasse = isReceita ? "text-[var(--success)]" : "text-[var(--danger)]";
  const corDot = isReceita ? "bg-success" : "bg-danger";
  const corLabel = isReceita ? "text-success" : "text-danger";
  const corBadge = isReceita ? "badge badge-success" : "badge badge-danger";
  const Icone = isReceita ? TrendingUp : TrendingDown;

  if (lancamentos.length === 0) {
    return (
      <section className="card" aria-label={titulo}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${corDot}`} aria-hidden="true" />
          <span className={`text-xs font-semibold uppercase tracking-wider ${corLabel}`}>
            {titulo}
          </span>
        </div>
        <p className="text-[var(--foreground-muted)] text-sm text-center py-10">
          Nenhum lançamento de {titulo.toLowerCase()} neste período.
        </p>
      </section>
    );
  }

  return (
    <section className="card" aria-label={titulo}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${corDot}`} aria-hidden="true" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${corLabel}`}>
              {titulo}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <Icone className={`w-4 h-4 flex-shrink-0 ${corClasse}`} aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {titulo} do Período
            </h2>
            <span className="text-xs text-[var(--foreground-subtle)] font-normal">
              {lancamentos.length} lançamento{lancamentos.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div
          className={`text-xl font-bold tracking-tight tabular-nums ${corClasse}`}
          aria-label={`Total de ${titulo}: ${formatarMoeda(total)}`}
        >
          {formatarMoeda(total)}
        </div>
      </div>

      {/* Tabela — desktop */}
      <div className="hidden md:block overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm" aria-label={`Tabela de ${titulo}`}>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Data
              </th>
              <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Descrição
              </th>
              <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Categoria
              </th>
              {!isReceita && (
                <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Fornecedor
                </th>
              )}
              <th className="text-right pb-3 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr
                key={l.id}
                className="border-b border-border/50 hover:bg-[var(--surface-raised)] transition-colors duration-100"
              >
                <td className="py-3 px-2 text-[var(--foreground-subtle)] whitespace-nowrap tabular-nums text-xs">
                  {formatarData(l.data)}
                </td>
                <td className="py-3 px-2 font-medium text-foreground text-sm">
                  {l.descricao}
                </td>
                <td className="py-3 px-2">
                  <span className={corBadge}>
                    {l.categoria.nome}
                  </span>
                </td>
                {!isReceita && (
                  <td className="py-3 px-2 text-[var(--foreground-muted)] text-sm">
                    {l.fornecedor ?? <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                )}
                <td
                  className={`py-3 px-2 text-right font-semibold tabular-nums ${corClasse}`}
                >
                  {formatarMoeda(l.valor)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--surface-raised)]">
              <td
                colSpan={isReceita ? 3 : 4}
                className="py-3 px-2 text-sm font-semibold text-[var(--foreground-muted)] text-right"
              >
                Total de {titulo}
              </td>
              <td
                className={`py-3 px-2 text-right font-bold text-base tabular-nums ${corClasse}`}
              >
                {formatarMoeda(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-2">
        {lancamentos.map((l) => (
          <div
            key={l.id}
            className="border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="font-medium text-sm text-foreground leading-snug">
                {l.descricao}
              </span>
              <span
                className={`font-bold text-sm flex-shrink-0 tabular-nums ${corClasse}`}
              >
                {formatarMoeda(l.valor)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--foreground-subtle)] tabular-nums">
                {formatarData(l.data)}
              </span>
              <span className="text-[var(--border-strong)]" aria-hidden="true">·</span>
              <span className={corBadge}>{l.categoria.nome}</span>
              {!isReceita && l.fornecedor && (
                <>
                  <span className="text-[var(--border-strong)]" aria-hidden="true">·</span>
                  <span className="text-xs text-[var(--foreground-muted)]">{l.fornecedor}</span>
                </>
              )}
            </div>
            {l.observacoes && (
              <p className="text-xs text-[var(--foreground-subtle)] mt-2 leading-relaxed">
                {l.observacoes}
              </p>
            )}
          </div>
        ))}

        {/* Total mobile */}
        <div
          className={`pt-3 mt-1 border-t border-border flex justify-between items-center font-bold ${corClasse}`}
        >
          <span className="text-sm">Total de {titulo}</span>
          <span className="text-base tabular-nums">{formatarMoeda(total)}</span>
        </div>
      </div>
    </section>
  );
}
