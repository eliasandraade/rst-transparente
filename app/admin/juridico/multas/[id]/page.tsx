export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData, formatarMoeda, formatarDataHoraAmigavel } from "@/lib/utils";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import MultaForm from "@/components/admin/juridico/MultaForm";
import type { MultaStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Multa | Jurídico | Admin" };

const STATUS_BADGE: Record<MultaStatus, string> = {
  APLICADA: "badge badge-warning", NOTIFICADA: "badge badge-warning",
  CONTESTADA: "badge badge-warning", MANTIDA: "badge badge-neutral",
  CANCELADA: "badge badge-neutral", PAGA: "badge badge-success", VENCIDA: "badge badge-neutral",
};
const STATUS_LABEL: Record<MultaStatus, string> = {
  APLICADA: "Aplicada", NOTIFICADA: "Notificada", CONTESTADA: "Contestada",
  MANTIDA: "Mantida", CANCELADA: "Cancelada", PAGA: "Paga", VENCIDA: "Vencida",
};

export default async function MultaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [multa, auditoria] = await Promise.all([
    prisma.multa.findUnique({
      where: { id },
      include: {
        criadoPor: { select: { name: true, email: true } },
        processo: { select: { id: true, numeroProcesso: true, classe: true } },
      },
    }),
    prisma.juridicoAuditoria.findMany({
      where: { entidade: "MULTA", entidadeId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { usuario: { select: { name: true } } },
    }),
  ]);

  if (!multa) notFound();

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <Link
          href="/admin/juridico/multas"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-foreground mb-3 transition-colors"
          style={{ minHeight: "auto" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Multas
        </Link>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={STATUS_BADGE[multa.status]}>{STATUS_LABEL[multa.status]}</span>
          <span className="text-sm font-mono font-bold text-foreground">Bloco {multa.bloco} / Unidade {multa.unidade}</span>
        </div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">{multa.motivo}</h1>
        <p className="text-xl font-black tabular-nums text-[var(--danger)] mt-1">{formatarMoeda(Number(multa.valor))}</p>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-3xl">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Dados da multa</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: "Aplicação", value: formatarData(multa.dataAplicacao) },
              { label: "Vencimento", value: multa.dataVencimento ? formatarData(multa.dataVencimento) : null },
              { label: "Pagamento", value: multa.dataPagamento ? formatarData(multa.dataPagamento) : null },
              { label: "Criado por", value: multa.criadoPor?.name },
              { label: "Processo vinculado", value: multa.processo?.numeroProcesso ?? null },
              { label: "Anexo", value: multa.anexoUrl ? multa.anexoNome ?? "Ver link" : null },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-[var(--foreground-subtle)] font-medium mb-0.5">{label}</dt>
                <dd className="text-sm text-foreground">{value ?? <span className="text-[var(--foreground-muted)]">—</span>}</dd>
              </div>
            ))}
          </dl>
          {multa.descricaoInterna && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-[var(--foreground-subtle)] font-medium mb-1">Descrição interna</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{multa.descricaoInterna}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Atualizar status</h2>
          <MultaForm
            modo="editar"
            multaId={id}
            defaultValues={{
              status: multa.status,
              valor: Number(multa.valor),
              dataVencimento: multa.dataVencimento?.toISOString().split("T")[0] ?? null,
              dataPagamento: multa.dataPagamento?.toISOString().split("T")[0] ?? null,
              descricaoInterna: multa.descricaoInterna,
            }}
          />
        </div>

        {auditoria.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Histórico de auditoria</h2>
            <div className="space-y-2">
              {auditoria.map((a) => (
                <div key={a.id} className="border-l-2 border-[var(--border)] pl-4 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{a.acao}</span>
                    <span className="text-xs text-[var(--foreground-muted)] tabular-nums">{formatarDataHoraAmigavel(a.createdAt)}</span>
                  </div>
                  {a.observacao && <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{a.observacao}</p>}
                  {a.usuario?.name && <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">por {a.usuario.name}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
