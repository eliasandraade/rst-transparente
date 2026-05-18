import { formatarMoeda } from "@/lib/utils";

interface GraficoCategoriaProps {
  dados: {
    categoriaId: string;
    categoriaNome: string;
    categoriaCor: string;
    total: number;
    percentual: number;
  }[];
}

export default function GraficoCategoria({ dados }: GraficoCategoriaProps) {
  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[var(--foreground-subtle)] text-sm">
        Sem dados para exibir neste período.
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="Distribuição de despesas por categoria">
      {dados.map((item) => (
        <div key={item.categoriaId} role="listitem">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.categoriaCor }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-foreground truncate">
                {item.categoriaNome}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-[var(--foreground-subtle)] tabular-nums w-10 text-right">
                {item.percentual.toFixed(1)}%
              </span>
              <span className="text-sm font-semibold text-[var(--danger)] tabular-nums w-28 text-right">
                {formatarMoeda(item.total)}
              </span>
            </div>
          </div>
          <div
            className="w-full bg-[var(--surface-raised)] rounded-full h-2"
            role="progressbar"
            aria-valuenow={Math.round(item.percentual)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${item.categoriaNome}: ${item.percentual.toFixed(1)}%`}
          >
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${item.percentual}%`,
                backgroundColor: item.categoriaCor,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
