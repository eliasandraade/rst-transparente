export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatarDataHoraAmigavel } from "@/lib/utils";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import Link from "next/link";
import type { JuridicoEntidade } from "@prisma/client";

export const metadata: Metadata = { title: "Auditoria | Jurídico | Admin" };

const VALID_ENTIDADES: JuridicoEntidade[] = ["PROCESSO", "NOTIFICACAO", "MULTA", "SINCRONIZACAO"];

const ENTIDADE_LABEL: Record<JuridicoEntidade, string> = {
  PROCESSO: "Processo", NOTIFICACAO: "Notificação", MULTA: "Multa", SINCRONIZACAO: "Sincronização",
};
const ENTIDADE_BADGE: Record<JuridicoEntidade, string> = {
  PROCESSO: "badge badge-neutral", NOTIFICACAO: "badge badge-warning",
  MULTA: "badge badge-neutral", SINCRONIZACAO: "badge badge-neutral",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ entidade?: string; pagina?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const rawEntidade = params.entidade;
  const pagina = Math.max(1, parseInt(params.pagina ?? "1", 10));
  const ITENS_POR_PAGINA = 50;

  const entidade =
    rawEntidade && VALID_ENTIDADES.includes(rawEntidade as JuridicoEntidade)
      ? (rawEntidade as JuridicoEntidade)
      : undefined;

  const [total, registros] = await Promise.all([
    prisma.juridicoAuditoria.count({ where: entidade ? { entidade } : {} }),
    prisma.juridicoAuditoria.findMany({
      where: entidade ? { entidade } : {},
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * ITENS_POR_PAGINA,
      take: ITENS_POR_PAGINA,
      include: { usuario: { select: { name: true } } },
    }),
  ]);

  const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)]" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Jurídico</span>
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Auditoria</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{total} registro{total !== 1 ? "s" : ""} no total</p>
      </div>

      <div className="px-6 py-5">
        <form method="GET" className="flex flex-wrap gap-3 mb-5">
          <select name="entidade" defaultValue={rawEntidade ?? ""} className="select w-auto text-sm">
            <option value="">Todas as entidades</option>
            {VALID_ENTIDADES.map((e) => <option key={e} value={e}>{ENTIDADE_LABEL[e]}</option>)}
          </select>
          <button type="submit" className="btn btn-secondary btn-sm">Filtrar</button>
          {rawEntidade && (
            <Link href="/admin/juridico/auditoria" className="btn btn-secondary btn-sm">Limpar</Link>
          )}
        </form>

        {registros.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3" aria-hidden="true">
              <FileText className="w-5 h-5 text-[var(--foreground-subtle)]" />
            </div>
            <p className="text-[var(--foreground-muted)] text-sm">Nenhum registro de auditoria encontrado.</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface-raised)] text-[var(--foreground-subtle)] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Data/hora</th>
                  <th className="px-4 py-3 text-left">Entidade</th>
                  <th className="px-4 py-3 text-left">Ação</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Observação</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--surface-raised)]">
                    <td className="px-4 py-2.5 tabular-nums text-[var(--foreground-muted)] whitespace-nowrap">
                      {formatarDataHoraAmigavel(r.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={ENTIDADE_BADGE[r.entidade]}>{ENTIDADE_LABEL[r.entidade]}</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-foreground">{r.acao}</td>
                    <td className="px-4 py-2.5 text-[var(--foreground-muted)] max-w-[220px] truncate hidden md:table-cell">
                      {r.observacao ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--foreground-muted)] hidden lg:table-cell">
                      {r.usuario?.name ?? "Sistema"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[var(--foreground-muted)]">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              {pagina > 1 && (
                <Link
                  href={`/admin/juridico/auditoria?${rawEntidade ? `entidade=${rawEntidade}&` : ""}pagina=${pagina - 1}`}
                  className="btn btn-secondary btn-sm"
                >
                  Anterior
                </Link>
              )}
              {pagina < totalPaginas && (
                <Link
                  href={`/admin/juridico/auditoria?${rawEntidade ? `entidade=${rawEntidade}&` : ""}pagina=${pagina + 1}`}
                  className="btn btn-secondary btn-sm"
                >
                  Próxima
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
