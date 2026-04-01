export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import { BarChart2, Plus, Pencil } from "lucide-react";

const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PUBLICADO: "Publicado",
};

const statusClass: Record<string, string> = {
  RASCUNHO: "bg-muted text-muted-foreground",
  PUBLICADO: "bg-success-light text-green-700",
};

const tipoLabel: Record<string, string> = {
  UNICA: "Única escolha",
  MULTIPLA: "Múltipla escolha",
};

export default async function EnquetesPage() {
  const enquetes = await prisma.enquete.findMany({
    include: {
      _count: { select: { votos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Enquetes</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie enquetes e consultas aos condôminos
            </p>
          </div>
        </div>
        <Link href="/admin/enquetes/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nova enquete
        </Link>
      </div>

      <div className="card">
        {enquetes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma enquete cadastrada ainda.{" "}
            <Link href="/admin/enquetes/novo" className="text-primary hover:underline">
              Criar primeira enquete
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Pergunta</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Total votos</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data fim</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {enquetes.map((enquete) => (
                  <tr key={enquete.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-foreground max-w-xs">
                      <span className="line-clamp-2">{enquete.pergunta}</span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                      {tipoLabel[enquete.tipo] ?? enquete.tipo}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[enquete.status] ?? "bg-muted"}`}
                      >
                        {statusLabel[enquete.status] ?? enquete.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {enquete._count.votos}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                      {enquete.dataFim ? formatarData(enquete.dataFim) : "—"}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/admin/enquetes/${enquete.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
