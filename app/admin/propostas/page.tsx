export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Propostas dos Moradores" };

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  ANALISANDO: "Analisando",
  RESPONDIDA: "Respondida",
  ARQUIVADA: "Arquivada",
};

const statusClass: Record<string, string> = {
  PENDENTE: "bg-warning-light text-yellow-700",
  ANALISANDO: "bg-blue-100 text-blue-700",
  RESPONDIDA: "bg-success-light text-green-700",
  ARQUIVADA: "bg-muted text-muted-foreground",
};

export default async function PropostasAdminPage() {
  const propostas = await prisma.proposta.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Propostas dos Moradores</h1>
        <p className="text-muted-foreground">
          {propostas.length} proposta{propostas.length !== 1 ? "s" : ""} recebida{propostas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {propostas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">Nenhuma proposta recebida ainda.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Unidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Texto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((proposta) => (
                <tr key={proposta.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatarData(proposta.createdAt)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {proposta.nome ?? <span className="text-muted-foreground italic">Anônimo</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {proposta.unidade ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 text-foreground">{proposta.texto}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[proposta.status]}`}>
                      {statusLabel[proposta.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/propostas/${proposta.id}`}
                      className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                      aria-label={`Ver proposta de ${proposta.nome ?? "anônimo"}`}
                    >
                      Ver detalhes
                    </Link>
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
