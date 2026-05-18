export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil, Bell } from "lucide-react";
import PublicarAvisoButton from "@/components/admin/PublicarAvisoButton";

export const metadata: Metadata = { title: "Avisos" };

export default async function AvisosAdminPage() {
  const avisos = await prisma.aviso.findMany({
    orderBy: [{ fixado: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">Administração</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Avisos e Informativos</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">Gerencie os avisos exibidos para os moradores</p>
        </div>
        <Link href="/admin/avisos/novo" className="btn btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Novo aviso
        </Link>
      </div>

      {avisos.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-5 h-5 text-[var(--foreground-subtle)]" aria-hidden="true" />
          </div>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">Nenhum aviso cadastrado ainda.</p>
          <Link href="/admin/avisos/novo" className="btn btn-primary inline-flex">
            <PlusCircle className="w-4 h-4" aria-hidden="true" /> Criar primeiro aviso
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-raised)] border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden md:table-cell">Fixado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden md:table-cell">Data</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {avisos.map((aviso) => (
                <tr key={aviso.id} className="hover:bg-[var(--surface-raised)] transition-colors duration-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground line-clamp-1">{aviso.titulo}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {aviso.status === "PUBLICADO" ? (
                      <span className="badge badge-success">Publicado</span>
                    ) : (
                      <span className="badge badge-neutral">Rascunho</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {aviso.fixado ? (
                      <span className="badge badge-warning">Sim</span>
                    ) : (
                      <span className="text-xs text-[var(--foreground-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--foreground-muted)] tabular-nums whitespace-nowrap">
                    {formatarData(aviso.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/avisos/${aviso.id}`}
                        className="btn btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                        aria-label={`Editar aviso: ${aviso.titulo}`}
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" /> Editar
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
