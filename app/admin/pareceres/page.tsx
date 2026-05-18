export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData, formatarPeriodo } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil, Download, FileText } from "lucide-react";
import PublicarParecerButton from "@/components/admin/PublicarParecerButton";

export const metadata: Metadata = { title: "Pareceres" };

export default async function ParecerAdminPage() {
  const pareceres = await prisma.parecer.findMany({
    orderBy: { periodoRef: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">Administração</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pareceres do Conselho Fiscal</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">Gerencie e publique os pareceres oficiais</p>
        </div>
        <Link href="/admin/pareceres/novo" className="btn btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Novo parecer
        </Link>
      </div>

      {pareceres.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-[var(--foreground-subtle)]" aria-hidden="true" />
          </div>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">Nenhum parecer cadastrado ainda.</p>
          <Link href="/admin/pareceres/novo" className="btn btn-primary inline-flex">
            <PlusCircle className="w-4 h-4" aria-hidden="true" /> Criar primeiro parecer
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-raised)] border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Período</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden sm:table-cell">Emissão</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pareceres.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--surface-raised)] transition-colors duration-100">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {formatarPeriodo(p.periodoRef)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{p.titulo}</div>
                    {p.arquivoUrl && (
                      <a
                        href={p.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 min-h-[auto]"
                      >
                        <Download className="w-3 h-3" aria-hidden="true" /> {p.arquivoNome ?? "PDF"}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] tabular-nums hidden sm:table-cell">
                    {formatarData(p.dataEmissao)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.status === "PUBLICADO" ? (
                      <span className="badge badge-success">Público</span>
                    ) : (
                      <span className="badge badge-neutral">Rascunho</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/pareceres/${p.id}`}
                        className="btn btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                        aria-label={`Editar parecer: ${p.titulo}`}
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" /> Editar
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
