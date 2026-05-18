"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatarMoeda, formatarPeriodo } from "@/lib/utils";

interface GraficoEvolucaoProps {
  dados: {
    periodo: string;
    receita: number;
    despesa: number;
    saldo: number;
  }[];
}

export default function GraficoEvolucao({ dados }: GraficoEvolucaoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";

  const c = {
    grid: dark ? "#1E2D45" : "#D4E0F5",
    axis: dark ? "#546278" : "#64748B",
    receita: dark ? "#4ADE80" : "#16A34A",
    despesa: dark ? "#F87171" : "#DC2626",
    tooltipBg: dark ? "#0F1829" : "#FFFFFF",
    tooltipBorder: dark ? "#283D5A" : "#D4E0F5",
    tooltipText: dark ? "#EEF2FF" : "#0F172A",
    tooltipMuted: dark ? "#8499B8" : "#475569",
  };

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--foreground-subtle)] text-sm">
        Sem dados históricos para exibir.
      </div>
    );
  }

  const dadosFormatados = dados.map((d) => ({
    ...d,
    nome: formatarPeriodo(d.periodo).slice(0, 8),
  }));

  const temAlgumDado = dados.some((d) => d.receita > 0 || d.despesa > 0);

  return (
    <div>
      {/* Gráfico */}
      <div
        className="w-full h-64"
        role="img"
        aria-label="Gráfico de barras com evolução financeira mensal"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dadosFormatados}
            margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={c.grid}
              vertical={false}
            />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 11, fill: c.axis }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c.axis }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  style: "currency",
                  currency: "BRL",
                }).format(v)
              }
            />
            <Tooltip
              cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              formatter={(value: number, name: string) => [
                formatarMoeda(value),
                name === "receita" ? "Receita" : "Despesa",
              ]}
              contentStyle={{
                fontSize: "13px",
                borderRadius: "8px",
                border: `1px solid ${c.tooltipBorder}`,
                backgroundColor: c.tooltipBg,
                color: c.tooltipText,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                padding: "8px 12px",
              }}
              labelStyle={{ color: c.tooltipMuted, fontSize: "12px", marginBottom: "4px" }}
            />
            <Bar dataKey="receita" fill={c.receita} radius={[3, 3, 0, 0]} />
            <Bar dataKey="despesa" fill={c.despesa} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda manual */}
      <div className="flex items-center justify-center gap-5 mt-3 mb-5">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: c.receita }}
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--foreground-muted)]">Receita</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: c.despesa }}
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--foreground-muted)]">Despesa</span>
        </div>
      </div>

      {/* Tabela acessível */}
      {temAlgumDado && (
        <div className="overflow-x-auto border-t border-border pt-4">
          <table
            className="w-full text-sm"
            aria-label="Tabela de evolução mensal"
          >
            <caption className="sr-only">
              Evolução financeira mensal — receitas, despesas e saldo
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Período
                </th>
                <th className="text-right pb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Receita
                </th>
                <th className="text-right pb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Despesa
                </th>
                <th className="text-right pb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.periodo} className="border-b border-border/50">
                  <td className="py-2.5 text-[var(--foreground-muted)] text-xs">
                    {formatarPeriodo(d.periodo)}
                  </td>
                  <td className="py-2.5 text-right text-[var(--success)] font-medium tabular-nums text-xs">
                    {d.receita > 0 ? formatarMoeda(d.receita) : <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                  <td className="py-2.5 text-right text-[var(--danger)] font-medium tabular-nums text-xs">
                    {d.despesa > 0 ? formatarMoeda(d.despesa) : <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                  <td
                    className={`py-2.5 text-right font-bold tabular-nums text-xs ${
                      d.saldo >= 0 ? "text-[var(--primary)]" : "text-[var(--danger)]"
                    }`}
                  >
                    {d.receita > 0 || d.despesa > 0
                      ? formatarMoeda(d.saldo)
                      : <span className="text-[var(--foreground-subtle)] font-normal">—</span>}
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
