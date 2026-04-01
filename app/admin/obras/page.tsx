export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarMoeda } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil } from "lucide-react";

export const metadata: Metadata = { title: "Obras" };

const statusLabel: Record<string, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const statusClass: Record<string, string> = {
  PLANEJADO: "bg-blue-100 text-blue-700",
  EM_ANDAMENTO: "bg-warning-light text-yellow-700",
  CONCLUIDO: "bg-success-light text-green-700",
  CANCELADO: "bg-muted text-muted-foreground",
};

function progressoColor(p: number) {
  if (p <= 33) return "bg-red-500";
  if (p <= 66) return "bg-yellow-500";
  return "bg-green-500";
}

export default async function ObrasAdminPage() {
  const obras = await prisma.obra.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Obras e Melhorias</h1>
          <p className="text-muted-foreground">Gerencie as obras e projetos do condomínio</p>
        </div>
        <Link href="/admin/obras/novo" className="btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Nova obra
        </Link>
      </div>

      {obras.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">Nenhuma obra cadastrada ainda.</p>
          <Link href="/admin/obras/novo" className="btn-primary mt-4 inline-flex">
            <PlusCircle className="w-4 h-4" /> Cadastrar primeira obra
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <div key={obra.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-base leading-snug line-clamp-2">{obra.titulo}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusClass[obra.status]}`}>
                  {statusLabel[obra.status]}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{obra.progresso}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressoColor(obra.progresso)}`}
                    style={{ width: `${obra.progresso}%` }}
                  />
                </div>
              </div>

              {(obra.orcamento || obra.gasto) && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {obra.orcamento && (
                    <div>Orçamento: <span className="text-foreground font-medium">{formatarMoeda(Number(obra.orcamento))}</span></div>
                  )}
                  {obra.gasto && (
                    <div>Gasto: <span className="text-foreground font-medium">{formatarMoeda(Number(obra.gasto))}</span></div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs ${obra.publicado ? "text-green-700" : "text-muted-foreground"}`}>
                  {obra.publicado ? "Visível ao público" : "Não publicada"}
                </span>
                <Link
                  href={`/admin/obras/${obra.id}`}
                  className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                  aria-label={`Editar obra: ${obra.titulo}`}
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
