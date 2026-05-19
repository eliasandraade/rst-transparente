export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarMoeda } from "@/lib/utils";
import type { Metadata } from "next";
import {
  Scale,
  FileText,
  Bell,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import JuridicoSyncButton from "@/components/admin/juridico/JuridicoSyncButton";

export const metadata: Metadata = {
  title: "Jurídico | Admin — Portal da Transparência",
};

export default async function JuridicoPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [
    processosAtivos,
    processosEncerrados,
    totalNotificacoes,
    totalMultas,
    multasEmAberto,
    valorTotalMultas,
    ultimaSinc,
  ] = await Promise.all([
    prisma.processo.count({ where: { ativo: true, status: { in: ["ATIVO", "SUSPENSO"] } } }),
    prisma.processo.count({ where: { ativo: true, status: { in: ["ENCERRADO", "ARQUIVADO"] } } }),
    prisma.notificacao.count({ where: { ativo: true } }),
    prisma.multa.count({ where: { ativo: true } }),
    prisma.multa.count({ where: { ativo: true, status: { in: ["APLICADA", "NOTIFICADA", "MANTIDA", "VENCIDA"] } } }),
    prisma.multa.aggregate({ where: { ativo: true }, _sum: { valor: true } }),
    prisma.processo.findFirst({
      where: { ativo: true, ultimaSincronizacao: { not: null } },
      orderBy: { ultimaSincronizacao: "desc" },
      select: { ultimaSincronizacao: true },
    }),
  ]);

  const valorTotal = Number(valorTotalMultas._sum.valor ?? 0);

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)]" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Administração
          </span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Jurídico</h1>
            {ultimaSinc?.ultimaSincronizacao && (
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Última sincronização:{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                }).format(ultimaSinc.ultimaSincronizacao)}
              </p>
            )}
          </div>
          <JuridicoSyncButton />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
              Processos ativos
            </p>
            <p className="text-2xl font-black tabular-nums text-foreground">{processosAtivos}</p>
            {processosEncerrados > 0 && (
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                {processosEncerrados} encerrados
              </p>
            )}
          </div>

          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
              Notificações
            </p>
            <p className="text-2xl font-black tabular-nums text-foreground">{totalNotificacoes}</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">total emitidas</p>
          </div>

          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
              Multas em aberto
            </p>
            <p className="text-2xl font-black tabular-nums text-[var(--danger)]">{multasEmAberto}</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">de {totalMultas} total</p>
          </div>

          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">
              Valor total multas
            </p>
            <p className="text-xl font-black tabular-nums text-foreground leading-snug">
              {formatarMoeda(valorTotal)}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">aplicadas</p>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/admin/juridico/processos"
            className="card card-interactive group flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-subtle)] flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground">Processos</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {processosAtivos} ativo{processosAtivos !== 1 ? "s" : ""}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:translate-x-0.5 transition-transform flex-shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/admin/juridico/notificacoes"
            className="card card-interactive group flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--warning-subtle)] flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-[var(--warning)]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground">Notificações</p>
              <p className="text-xs text-[var(--foreground-muted)]">{totalNotificacoes} total</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:translate-x-0.5 transition-transform flex-shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/admin/juridico/multas"
            className="card card-interactive group flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--danger-subtle)] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[var(--danger)]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground">Multas</p>
              <p className="text-xs text-[var(--foreground-muted)]">{totalMultas} total</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:translate-x-0.5 transition-transform flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>

        {/* Links secundários */}
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/juridico/processos/novo" className="btn btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Novo processo
          </Link>
          <Link href="/admin/juridico/notificacoes/nova" className="btn btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nova notificação
          </Link>
          <Link href="/admin/juridico/multas/nova" className="btn btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Nova multa
          </Link>
          <Link href="/admin/juridico/auditoria" className="btn btn-secondary btn-sm">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            Auditoria
          </Link>
        </div>
      </div>
    </div>
  );
}
