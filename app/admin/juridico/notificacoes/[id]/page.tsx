export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData, formatarDataHoraAmigavel } from "@/lib/utils";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import NotificacaoForm from "@/components/admin/juridico/NotificacaoForm";
import type { NotificacaoStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Notificação | Jurídico | Admin" };

const STATUS_BADGE: Record<NotificacaoStatus, string> = {
  EMITIDA: "badge badge-warning", ENTREGUE: "badge badge-neutral",
  RESPONDIDA: "badge badge-success", CONTESTADA: "badge badge-warning",
  ARQUIVADA: "badge badge-neutral",
};
const STATUS_LABEL: Record<NotificacaoStatus, string> = {
  EMITIDA: "Emitida", ENTREGUE: "Entregue", RESPONDIDA: "Respondida",
  CONTESTADA: "Contestada", ARQUIVADA: "Arquivada",
};

export default async function NotificacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [notificacao, auditoria] = await Promise.all([
    prisma.notificacao.findUnique({
      where: { id },
      include: {
        criadoPor: { select: { name: true, email: true } },
        processo: { select: { id: true, numeroProcesso: true, classe: true } },
      },
    }),
    prisma.juridicoAuditoria.findMany({
      where: { entidade: "NOTIFICACAO", entidadeId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { usuario: { select: { name: true } } },
    }),
  ]);

  if (!notificacao) notFound();

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <Link
          href="/admin/juridico/notificacoes"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-foreground mb-3 transition-colors"
          style={{ minHeight: "auto" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Notificações
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={STATUS_BADGE[notificacao.status]}>{STATUS_LABEL[notificacao.status]}</span>
          <span className="text-sm font-mono font-bold text-foreground">
            Bloco {notificacao.bloco} / Unidade {notificacao.unidade}
          </span>
        </div>
        <h1 className="text-lg font-bold text-foreground tracking-tight mt-1">{notificacao.motivo}</h1>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-3xl">
        {/* Dados */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Dados da notificação</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: "Emissão", value: formatarData(notificacao.dataEmissao) },
              { label: "Entrega", value: notificacao.dataEntrega ? formatarData(notificacao.dataEntrega) : null },
              { label: "Resposta", value: notificacao.dataResposta ? formatarData(notificacao.dataResposta) : null },
              { label: "Criado por", value: notificacao.criadoPor?.name },
              { label: "Processo vinculado", value: notificacao.processo?.numeroProcesso ?? null },
              { label: "Anexo", value: notificacao.anexoUrl ? notificacao.anexoNome ?? "Ver link" : null },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-[var(--foreground-subtle)] font-medium mb-0.5">{label}</dt>
                <dd className="text-sm text-foreground">{value ?? <span className="text-[var(--foreground-muted)]">—</span>}</dd>
              </div>
            ))}
          </dl>
          {notificacao.descricaoInterna && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-[var(--foreground-subtle)] font-medium mb-1">Descrição interna</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{notificacao.descricaoInterna}</p>
            </div>
          )}
        </div>

        {/* Editar status */}
        <div className="card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Atualizar status</h2>
          <NotificacaoForm
            modo="editar"
            notificacaoId={id}
            defaultValues={{
              status: notificacao.status,
              dataEntrega: notificacao.dataEntrega?.toISOString().split("T")[0] ?? null,
              dataResposta: notificacao.dataResposta?.toISOString().split("T")[0] ?? null,
              descricaoInterna: notificacao.descricaoInterna,
            }}
          />
        </div>

        {/* Auditoria */}
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
