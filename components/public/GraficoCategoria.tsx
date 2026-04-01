"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Sem dados para exibir neste período.
      </div>
    );
  }

  return (
    <div>
      {/* Gráfico de pizza — visual */}
      <div
        className="w-full h-64"
        role="img"
        aria-label="Gráfico de despesas por categoria"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="total"
              nameKey="categoriaNome"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ percentual }) => `${percentual.toFixed(1)}%`}
              labelLine={false}
            >
              {dados.map((entry) => (
                <Cell key={entry.categoriaId} fill={entry.categoriaCor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatarMoeda(value), "Total"]}
              contentStyle={{
                fontSize: "14px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: "13px", color: "#1E293B" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela alternativa para acessibilidade */}
      <table
        className="w-full text-sm mt-4"
        aria-label="Tabela de despesas por categoria"
      >
        <caption className="sr-only">Distribuição de despesas por categoria</caption>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted-foreground">
              Categoria
            </th>
            <th className="text-right py-2 font-medium text-muted-foreground">
              Total
            </th>
            <th className="text-right py-2 font-medium text-muted-foreground">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr
              key={item.categoriaId}
              className="border-b border-border/50"
            >
              <td className="py-2 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.categoriaCor }}
                  aria-hidden="true"
                />
                {item.categoriaNome}
              </td>
              <td className="py-2 text-right font-medium">
                {formatarMoeda(item.total)}
              </td>
              <td className="py-2 text-right text-muted-foreground">
                {item.percentual.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
