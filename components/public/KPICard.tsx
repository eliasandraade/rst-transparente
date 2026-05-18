import { cn, formatarMoeda } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  titulo: string;
  valor: number;
  descricao?: string;
  icone: LucideIcon;
  variante?: "receita" | "despesa" | "saldo" | "neutro";
  className?: string;
}

const variantesEstilo = {
  receita: {
    dot: "bg-success",
    label: "text-success",
    valor: "text-success",
    icone: "text-success",
  },
  despesa: {
    dot: "bg-danger",
    label: "text-danger",
    valor: "text-danger",
    icone: "text-danger",
  },
  saldo: {
    dot: "bg-primary",
    label: "text-primary",
    valor: "text-primary",
    icone: "text-primary",
  },
  neutro: {
    dot: "bg-[var(--foreground-subtle)]",
    label: "text-[var(--foreground-subtle)]",
    valor: "text-foreground",
    icone: "text-[var(--foreground-muted)]",
  },
};

const variantesLabel = {
  receita: "Receita",
  despesa: "Despesa",
  saldo: "Saldo",
  neutro: "",
};

export default function KPICard({
  titulo,
  valor,
  descricao,
  icone: Icone,
  variante = "neutro",
  className,
}: KPICardProps) {
  const estilos = variantesEstilo[variante];
  const labelVariante = variantesLabel[variante];

  return (
    <div
      className={cn("card flex flex-col gap-4", className)}
      role="region"
      aria-label={titulo}
    >
      {/* Topo: categoria + ícone */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {labelVariante && (
            <>
              <div
                className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", estilos.dot)}
                aria-hidden="true"
              />
              <span className={cn("text-xs font-semibold uppercase tracking-wider", estilos.label)}>
                {labelVariante}
              </span>
            </>
          )}
        </div>
        <Icone
          className={cn("w-4 h-4 flex-shrink-0", estilos.icone)}
          aria-hidden="true"
        />
      </div>

      {/* Valor principal */}
      <div>
        <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
          {titulo}
        </p>
        <p
          className={cn(
            "text-2xl font-bold tracking-tight tabular-nums",
            estilos.valor
          )}
          aria-label={`${titulo}: ${formatarMoeda(valor)}`}
        >
          {formatarMoeda(valor)}
        </p>
        {descricao && (
          <p className="text-xs text-[var(--foreground-subtle)] mt-1.5 leading-relaxed">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
}
