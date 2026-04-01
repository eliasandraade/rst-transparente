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
    container: "border-l-4 border-l-success",
    icone: "bg-success-light text-green-700",
    valor: "text-green-700",
  },
  despesa: {
    container: "border-l-4 border-l-danger",
    icone: "bg-danger-light text-red-700",
    valor: "text-red-700",
  },
  saldo: {
    container: "border-l-4 border-l-primary",
    icone: "bg-primary/10 text-primary",
    valor: "text-primary",
  },
  neutro: {
    container: "",
    icone: "bg-muted text-muted-foreground",
    valor: "text-foreground",
  },
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

  return (
    <div
      className={cn(
        "card flex flex-col gap-3",
        estilos.container,
        className
      )}
      role="region"
      aria-label={titulo}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{titulo}</span>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            estilos.icone
          )}
          aria-hidden="true"
        >
          <Icone className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p
          className={cn("text-2xl font-bold tracking-tight", estilos.valor)}
          aria-label={`${titulo}: ${formatarMoeda(valor)}`}
        >
          {formatarMoeda(valor)}
        </p>
        {descricao && (
          <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
        )}
      </div>
    </div>
  );
}
