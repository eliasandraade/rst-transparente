"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatarPeriodo, gerarPeriodos } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

interface FiltroPeriodoProps {
  periodoAtivo: string;
  periodosDisponiveis?: string[];
}

export default function FiltroPeriodo({
  periodoAtivo,
  periodosDisponiveis,
}: FiltroPeriodoProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const periodos = periodosDisponiveis ?? gerarPeriodos(12);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label
        htmlFor="filtro-periodo"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
      >
        <CalendarDays className="w-4 h-4" aria-hidden="true" />
        Período:
      </label>
      <select
        id="filtro-periodo"
        value={periodoAtivo}
        onChange={handleChange}
        className="input w-auto min-w-[180px] cursor-pointer"
        aria-label="Selecionar período para filtrar dados"
      >
        {periodos.map((p) => (
          <option key={p} value={p}>
            {formatarPeriodo(p)}
          </option>
        ))}
      </select>
    </div>
  );
}
