import { prisma } from "@/lib/prisma";
import { formatarMoeda, formatarData, formatarPeriodo, gerarPeriodos } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil, Eye, EyeOff } from "lucide-react";
import PublicarLancamentoButton from "@/components/admin/PublicarLancamentoButton";

export const metadata: Metadata = { title: "Lançamentos" };

interface Props {
  searchParams: Promise<{ periodo?: string; tipo?: string }>;
}

export default async function LancamentosPage({ searchParams }: Props) {
  const params = await searchParams;
  const periodos = gerarPeriodos(24);
  const periodo = params.periodo ?? periodos[0];
  const tipoFiltro = params.tipo as "RECEITA" | "DESPESA" | undefined;

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      periodo,
      ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
    },
    include: { categoria: true },
    orderBy: [{ tipo: "asc" }, { data: "asc" }],
  });

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "RECEITA")
    .reduce((acc, l) => acc + Number(l.valor), 0);
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce((acc, l) => acc + Number(l.valor), 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie receitas e despesas do condomínio
          </p>
        </div>
        <Link href="/admin/lancamentos/novo" className="btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Novo lançamento
        </Link>
      </div>

      {/* Filtros */}
      <div className="card">
        <form method="get" className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="periodo" className="label">Período</label>
            <select id="periodo" name="periodo" defaultValue={periodo} className="input w-auto min-w-[180px]">
              {periodos.map((p) => (
                <option key={p} value={p}>{formatarPeriodo(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipo" className="label">Tipo</label>
            <select id="tipo" name="tipo" defaultValue={tipoFiltro ?? ""} className="input w-auto">
              <option value="">Todos</option>
              <option value="RECEITA">Receitas</option>
              <option value="DESPESA">Despesas</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary">Filtrar</button>
        </form>
      </div>

      {/* Resumo */}
      {lancamentos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card py-3">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="font-bold text-green-700">{formatarMoeda(totalReceitas)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="font-bold text-red-700">{formatarMoeda(totalDespesas)}</p>
          </div>
          <div className="card py-3">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`font-bold ${totalReceitas - totalDespesas >= 0 ? "text-primary" : "text-red-700"}`}>
              {formatarMoeda(totalReceitas - totalDespesas)}
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {lancamentos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">Nenhum lançamento neste período.</p>
          <Link href="/admin/lancamentos/novo" className="btn-primary mt-4 inline-flex">
            <PlusCircle className="w-4 h-4" /> Criar primeiro lançamento
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatarData(l.data)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.descricao}</div>
                    {l.fornecedor && (
                      <div className="text-xs text-muted-foreground">{l.fornecedor}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={l.tipo === "RECEITA" ? "badge-receita" : "badge-despesa"}>
                      {l.categoria.nome}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${l.tipo === "RECEITA" ? "text-green-700" : "text-red-700"}`}>
                    {formatarMoeda(Number(l.valor))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {l.status === "PUBLICADO" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-success-light px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" /> Público
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Rascunho
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/lancamentos/${l.id}`}
                        className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                        aria-label={`Editar lançamento: ${l.descricao}`}
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </Link>
                      <PublicarLancamentoButton
                        id={l.id}
                        status={l.status}
                      />
                    </div>
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
