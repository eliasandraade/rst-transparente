"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Sem dados históricos para exibir.
      </div>
    );
  }

  const dadosFormatados = dados.map((d) => ({
    ...d,
    nome: formatarPeriodo(d.periodo).replace(/\/(20\d\d)$/, "/$1").slice(0, 8),
  }));

  return (
    <div>
      {/* Gráfico */}
      <div
        className="w-full h-72"
        role="img"
        aria-label="Gráfico de evolução financeira mensal"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dadosFormatados}
            margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 12, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  style: "currency",
                  currency: "BRL",
                }).format(v)
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatarMoeda(value),
                name === "receita"
                  ? "Receita"
                  : name === "despesa"
                  ? "Despesa"
                  : "Saldo",
              ]}
              contentStyle={{
                fontSize: "14px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: "13px", color: "#1E293B" }}>
                  {value === "receita"
                    ? "Receita"
                    : value === "despesa"
                    ? "Despesa"
                    : "Saldo"}
                </span>
              )}
            />
            <Bar dataKey="receita" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela acessível */}
      <div className="overflow-x-auto mt-4">
        <table
          className="w-full text-sm"
          aria-label="Tabela de evolução mensal"
        >
          <caption className="sr-only">
            Evolução financeira mensal — receitas, despesas e saldo
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted-foreground">Período</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Receita</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Despesa</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d) => (
              <tr key={d.periodo} className="border-b border-border/50">
                <td className="py-2">{formatarPeriodo(d.periodo)}</td>
                <td className="py-2 text-right text-green-700 font-medium">
                  {formatarMoeda(d.receita)}
                </td>
                <td className="py-2 text-right text-red-700 font-medium">
                  {formatarMoeda(d.despesa)}
                </td>
                <td
                  className={`py-2 text-right font-bold ${
                    d.saldo >= 0 ? "text-primary" : "text-red-700"
                  }`}
                >
                  {formatarMoeda(d.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
