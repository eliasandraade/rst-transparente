import { prisma } from "@/lib/prisma";
import { formatarData, formatarPeriodo } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil, Eye, EyeOff, Download } from "lucide-react";
import PublicarParecerButton from "@/components/admin/PublicarParecerButton";

export const metadata: Metadata = { title: "Pareceres" };

export default async function ParecerAdminPage() {
  const pareceres = await prisma.parecer.findMany({
    orderBy: { periodoRef: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pareceres do Conselho Fiscal</h1>
          <p className="text-muted-foreground">
            Gerencie e publique os pareceres oficiais
          </p>
        </div>
        <Link href="/admin/pareceres/novo" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Novo parecer
        </Link>
      </div>

      {pareceres.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">Nenhum parecer cadastrado ainda.</p>
          <Link href="/admin/pareceres/novo" className="btn-primary mt-4 inline-flex">
            <PlusCircle className="w-4 h-4" /> Criar primeiro parecer
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Período</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Emissão</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pareceres.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {formatarPeriodo(p.periodoRef)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.titulo}</div>
                    {p.arquivoUrl && (
                      <a
                        href={p.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 min-h-[auto]"
                      >
                        <Download className="w-3 h-3" /> {p.arquivoNome ?? "PDF"}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatarData(p.dataEmissao)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.status === "PUBLICADO" ? (
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
                        href={`/admin/pareceres/${p.id}`}
                        className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                        aria-label={`Editar parecer: ${p.titulo}`}
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </Link>
                      <PublicarParecerButton id={p.id} status={p.status} />
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
