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
    <div className="flex items-center gap-2.5 flex-wrap">
      <label
        htmlFor="filtro-periodo"
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)] whitespace-nowrap"
      >
        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        Período
      </label>
      <select
        id="filtro-periodo"
        value={periodoAtivo}
        onChange={handleChange}
        className="select w-auto min-w-[180px] cursor-pointer text-sm"
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
