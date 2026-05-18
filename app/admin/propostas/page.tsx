export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Propostas dos Moradores" };

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  ANALISANDO: "Analisando",
  RESPONDIDA: "Respondida",
  ARQUIVADA: "Arquivada",
};

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "badge badge-warning",
  ANALISANDO: "badge badge-neutral",
  RESPONDIDA: "badge badge-success",
  ARQUIVADA: "badge badge-neutral",
};

export default async function PropostasAdminPage() {
  const propostas = await prisma.proposta.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">Administração</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Propostas dos Moradores</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          <span className="font-semibold text-foreground tabular-nums">{propostas.length}</span>{" "}
          proposta{propostas.length !== 1 ? "s" : ""} recebida{propostas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {propostas.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-[var(--foreground-subtle)]" aria-hidden="true" />
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">Nenhuma proposta recebida ainda.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-raised)] border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] whitespace-nowrap">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden sm:table-cell">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden md:table-cell">Unidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Texto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propostas.map((proposta) => (
                <tr key={proposta.id} className="hover:bg-[var(--surface-raised)] transition-colors duration-100">
                  <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] tabular-nums whitespace-nowrap">
                    {formatarData(proposta.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell text-foreground">
                    {proposta.nome ?? (
                      <span className="text-[var(--foreground-muted)] italic">Anônimo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell text-[var(--foreground-muted)]">
                    {proposta.unidade ?? "—"}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 text-sm text-foreground">{proposta.texto}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={STATUS_BADGE[proposta.status] ?? "badge badge-neutral"}>
                      {STATUS_LABEL[proposta.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/propostas/${proposta.id}`}
                      className="btn btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                      aria-label={`Ver proposta de ${proposta.nome ?? "anônimo"}`}
                    >
                      Ver
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
