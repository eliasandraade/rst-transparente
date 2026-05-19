export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData } from "@/lib/utils";
import type { Metadata } from "next";
import { Bell, Plus } from "lucide-react";
import type { NotificacaoStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Notificações | Jurídico | Admin" };

const VALID_STATUS: NotificacaoStatus[] = ["EMITIDA", "ENTREGUE", "RESPONDIDA", "CONTESTADA", "ARQUIVADA"];

const STATUS_BADGE: Record<NotificacaoStatus, string> = {
  EMITIDA: "badge badge-warning",
  ENTREGUE: "badge badge-neutral",
  RESPONDIDA: "badge badge-success",
  CONTESTADA: "badge badge-warning",
  ARQUIVADA: "badge badge-neutral",
};
const STATUS_LABEL: Record<NotificacaoStatus, string> = {
  EMITIDA: "Emitida", ENTREGUE: "Entregue", RESPONDIDA: "Respondida",
  CONTESTADA: "Contestada", ARQUIVADA: "Arquivada",
};

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; bloco?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const rawStatus = params.status;
  const bloco = params.bloco;

  const status =
    rawStatus && VALID_STATUS.includes(rawStatus as NotificacaoStatus)
      ? (rawStatus as NotificacaoStatus)
      : undefined;

  const notificacoes = await prisma.notificacao.findMany({
    where: {
      ativo: true,
      ...(status ? { status } : {}),
      ...(bloco ? { bloco: bloco.toUpperCase() } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      criadoPor: { select: { name: true } },
      processo: { select: { id: true, numeroProcesso: true } },
    },
  });

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)]" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Jurídico</span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Notificações</h1>
          <Link href="/admin/juridico/notificacoes/nova" className="btn btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nova notificação
          </Link>
        </div>
      </div>

      <div className="px-6 py-5">
        <form method="GET" className="flex flex-wrap gap-3 mb-5">
          <select name="status" defaultValue={rawStatus ?? ""} className="select w-auto text-sm">
            <option value="">Todos os status</option>
            {VALID_STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select name="bloco" defaultValue={bloco ?? ""} className="select w-auto text-sm">
            <option value="">Todos os blocos</option>
            {"ABCDEFGHI".split("").map((b) => <option key={b} value={b}>Bloco {b}</option>)}
          </select>
          <button type="submit" className="btn btn-secondary btn-sm">Filtrar</button>
          {(rawStatus || bloco) && (
            <Link href="/admin/juridico/notificacoes" className="btn btn-secondary btn-sm">Limpar</Link>
          )}
        </form>

        {notificacoes.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3" aria-hidden="true">
              <Bell className="w-5 h-5 text-[var(--foreground-subtle)]" />
            </div>
            <p className="text-[var(--foreground-muted)] text-sm font-medium">Nenhuma notificação encontrada.</p>
            <Link href="/admin/juridico/notificacoes/nova" className="btn btn-primary btn-sm mt-4 inline-flex">
              Criar notificação
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-raised)] text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-left">Bloco / Unidade</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Data emissão</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Criado por</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notificacoes.map((n) => (
                  <tr key={n.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs tabular-nums">
                      Bl.{n.bloco} / {n.unidade}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[200px] truncate">{n.motivo}</td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] hidden md:table-cell tabular-nums">
                      {formatarData(n.dataEmissao)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[n.status]}>{STATUS_LABEL[n.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] hidden lg:table-cell">
                      {n.criadoPor?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/juridico/notificacoes/${n.id}`} className="text-xs font-medium text-primary hover:underline">
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
