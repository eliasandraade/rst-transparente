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
  const corTotal = isReceita ? "text-green-700" : "text-red-700";
  const corBadge = isReceita ? "badge-receita" : "badge-despesa";
  const Icone = isReceita ? TrendingUp : TrendingDown;
  const corIcone = isReceita ? "text-green-600" : "text-red-600";

  if (lancamentos.length === 0) {
    return (
      <section className="card" aria-label={titulo}>
        <div className="flex items-center gap-2 mb-4">
          <Icone className={`w-5 h-5 ${corIcone}`} aria-hidden="true" />
          <h2 className="text-xl font-semibold">{titulo}</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhum lançamento de {titulo.toLowerCase()} neste período.
        </p>
      </section>
    );
  }

  return (
    <section className="card" aria-label={titulo}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Icone className={`w-5 h-5 ${corIcone}`} aria-hidden="true" />
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <span className="text-sm text-muted-foreground">
            ({lancamentos.length} lançamento{lancamentos.length !== 1 ? "s" : ""})
          </span>
        </div>
        <div
          className={`text-xl font-bold ${corTotal}`}
          aria-label={`Total de ${titulo}: ${formatarMoeda(total)}`}
        >
          {formatarMoeda(total)}
        </div>
      </div>

      {/* Tabela — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" aria-label={`Tabela de ${titulo}`}>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                Data
              </th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                Descrição
              </th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                Categoria
              </th>
              {!isReceita && (
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  Fornecedor
                </th>
              )}
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr
                key={l.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                  {formatarData(l.data)}
                </td>
                <td className="py-3 px-2 font-medium">{l.descricao}</td>
                <td className="py-3 px-2">
                  <span
                    className={corBadge}
                    style={{ borderColor: l.categoria.cor }}
                  >
                    {l.categoria.nome}
                  </span>
                </td>
                {!isReceita && (
                  <td className="py-3 px-2 text-muted-foreground">
                    {l.fornecedor ?? "—"}
                  </td>
                )}
                <td
                  className={`py-3 px-2 text-right font-semibold ${corTotal}`}
                >
                  {formatarMoeda(l.valor)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30">
              <td
                colSpan={isReceita ? 3 : 4}
                className="py-3 px-2 font-semibold text-right"
              >
                Total de {titulo}
              </td>
              <td
                className={`py-3 px-2 text-right font-bold text-lg ${corTotal}`}
              >
                {formatarMoeda(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {lancamentos.map((l) => (
          <div
            key={l.id}
            className="border border-border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-base">{l.descricao}</span>
              <span className={`font-bold text-base flex-shrink-0 ${corTotal}`}>
                {formatarMoeda(l.valor)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
              <span>{formatarData(l.data)}</span>
              <span>•</span>
              <span className={corBadge}>{l.categoria.nome}</span>
              {!isReceita && l.fornecedor && (
                <>
                  <span>•</span>
                  <span>{l.fornecedor}</span>
                </>
              )}
            </div>
            {l.observacoes && (
              <p className="text-sm text-muted-foreground italic">
                {l.observacoes}
              </p>
            )}
          </div>
        ))}
        {/* Total mobile */}
        <div
          className={`border-t-2 border-border pt-3 flex justify-between items-center font-bold ${corTotal}`}
        >
          <span>Total de {titulo}</span>
          <span className="text-lg">{formatarMoeda(total)}</span>
        </div>
      </div>
    </section>
  );
}
