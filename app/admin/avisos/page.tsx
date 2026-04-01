export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil } from "lucide-react";
import PublicarAvisoButton from "@/components/admin/PublicarAvisoButton";

export const metadata: Metadata = { title: "Avisos" };

export default async function AvisosAdminPage() {
  const avisos = await prisma.aviso.findMany({
    orderBy: [{ fixado: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avisos e Informativos</h1>
          <p className="text-muted-foreground">Gerencie os avisos exibidos para os moradores</p>
        </div>
        <Link href="/admin/avisos/novo" className="btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Novo aviso
        </Link>
      </div>

      {avisos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">Nenhum aviso cadastrado ainda.</p>
          <Link href="/admin/avisos/novo" className="btn-primary mt-4 inline-flex">
            <PlusCircle className="w-4 h-4" /> Criar primeiro aviso
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fixado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {avisos.map((aviso) => (
                <tr key={aviso.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{aviso.titulo}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {aviso.status === "PUBLICADO" ? (
                      <span className="inline-flex items-center text-xs text-green-700 bg-success-light px-2 py-0.5 rounded-full">
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Rascunho
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {aviso.fixado ? (
                      <span className="text-xs text-yellow-700">Sim</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                    {formatarData(aviso.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/avisos/${aviso.id}`}
                        className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                        aria-label={`Editar aviso: ${aviso.titulo}`}
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </Link>
                      <PublicarAvisoButton id={aviso.id} status={aviso.status} />
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
