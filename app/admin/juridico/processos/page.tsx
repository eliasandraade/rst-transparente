export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarNumeroProcesso } from "@/lib/juridico";
import { formatarDataHoraAmigavel } from "@/lib/utils";
import type { Metadata } from "next";
import { Scale, Plus, RefreshCw, Archive } from "lucide-react";
import type { ProcessoStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Processos | Jurídico | Admin",
};

const VALID_STATUS: ProcessoStatus[] = ["ATIVO", "SUSPENSO", "ENCERRADO", "ARQUIVADO"];

const STATUS_BADGE: Record<ProcessoStatus, string> = {
  ATIVO: "badge badge-success",
  SUSPENSO: "badge badge-warning",
  ENCERRADO: "badge badge-neutral",
  ARQUIVADO: "badge badge-neutral",
};
const STATUS_LABEL: Record<ProcessoStatus, string> = {
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  ENCERRADO: "Encerrado",
  ARQUIVADO: "Arquivado",
};

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; arquivados?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const rawStatus = params.status;
  const search = params.search;
  const verArquivados = params.arquivados === "1";

  const status =
    rawStatus && VALID_STATUS.includes(rawStatus as ProcessoStatus)
      ? (rawStatus as ProcessoStatus)
      : undefined;

  const processos = await prisma.processo.findMany({
    where: {
      ativo: !verArquivados,
      ...(status && !verArquivados ? { status } : {}),
      ...(search
        ? {
            OR: [
              { numeroProcesso: { contains: search, mode: "insensitive" } },
              { classe: { contains: search, mode: "insensitive" } },
              { assunto: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)]" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Jurídico
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Processos</h1>
          <Link href="/admin/juridico/processos/novo" className="btn btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo processo
          </Link>
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Abas Ativos / Arquivados */}
        <div className="flex gap-1 mb-5 border-b border-border">
          <Link
            href="/admin/juridico/processos"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              !verArquivados
                ? "border-primary text-primary"
                : "border-transparent text-[var(--foreground-muted)] hover:text-foreground"
            }`}
          >
            Ativos
          </Link>
          <Link
            href="/admin/juridico/processos?arquivados=1"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              verArquivados
                ? "border-primary text-primary"
                : "border-transparent text-[var(--foreground-muted)] hover:text-foreground"
            }`}
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            Arquivados
          </Link>
        </div>

        {/* Filtros (só na aba Ativos) */}
        {!verArquivados && (
          <form method="GET" className="flex flex-wrap gap-3 mb-5">
            <input
              name="search"
              defaultValue={search}
              placeholder="Buscar por número, classe ou assunto..."
              className="input pl-3 w-full sm:w-72 text-sm"
            />
            <select name="status" defaultValue={rawStatus ?? ""} className="select w-auto text-sm">
              <option value="">Todos os status</option>
              {VALID_STATUS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary btn-sm">Filtrar</button>
            {(search || rawStatus) && (
              <Link href="/admin/juridico/processos" className="btn btn-secondary btn-sm">Limpar</Link>
            )}
          </form>
        )}

        {processos.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3" aria-hidden="true">
              {verArquivados ? <Archive className="w-5 h-5 text-[var(--foreground-subtle)]" /> : <Scale className="w-5 h-5 text-[var(--foreground-subtle)]" />}
            </div>
            <p className="text-[var(--foreground-muted)] text-sm font-medium">
              {verArquivados
                ? "Nenhum processo arquivado."
                : search || status
                ? "Nenhum processo encontrado."
                : "Nenhum processo cadastrado."}
            </p>
            {!verArquivados && !search && !status && (
              <Link href="/admin/juridico/processos/novo" className="btn btn-primary btn-sm mt-4 inline-flex">
                Cadastrar primeiro processo
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-raised)] text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-left">Número</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Classe / Assunto</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Última movimentação</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Origem</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processos.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold tabular-nums">
                      {formatarNumeroProcesso(p.numeroProcesso)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
                        {p.classe ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] truncate max-w-[200px]">
                        {p.assunto ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] hidden lg:table-cell">
                      {p.dataUltimaMovim
                        ? formatarDataHoraAmigavel(p.dataUltimaMovim)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] hidden sm:table-cell">
                      {p.origem === "DATAJUD" ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                          DataJud
                        </span>
                      ) : (
                        "Manual"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/juridico/processos/${p.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Detalhes
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
