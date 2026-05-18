"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDA", label: "Resolvida" },
  { value: "ENCERRADA_SEM_ACAO", label: "Encerrada sem ação" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas as categorias" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "BARULHO", label: "Barulho" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "VAZAMENTO", label: "Vazamento" },
  { value: "SUGESTAO", label: "Sugestão" },
  { value: "RECLAMACAO", label: "Reclamação" },
  { value: "OUTROS", label: "Outros" },
];

export default function DemandaFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-52">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-muted)]"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Buscar protocolo ou título..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="input pl-9 text-sm"
        />
      </div>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="select w-auto"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="select w-auto"
      >
        {CATEGORY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
