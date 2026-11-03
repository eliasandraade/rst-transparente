import { staffSession } from "@/lib/staff";
import { requireTenant } from "@/lib/tenant";
import { parseUnitLayout } from "@/lib/units";
import Link from "@/lib/org-navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import NotificacaoForm from "@/components/admin/juridico/NotificacaoForm";
import { formatarNumeroProcesso } from "@/lib/juridico";
import { orgRedirect } from "@/lib/org-server";

export const metadata: Metadata = { title: "Nova Notificação | Jurídico | Admin" };

export default async function NovaNotificacaoPage() {
  const { org, db } = await requireTenant();
  const session = await staffSession();
  if (!session) return orgRedirect("/admin/login");

  const processos = await db.processo.findMany({
    where: { ativo: true, status: { in: ["ATIVO", "SUSPENSO"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, numeroProcesso: true, classe: true },
  });

  const processosFormatados = processos.map((p) => ({
    ...p,
    numeroProcesso: formatarNumeroProcesso(p.numeroProcesso),
  }));

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
        <h1 className="text-xl font-bold text-foreground tracking-tight">Nova notificação</h1>
      </div>
      <div className="px-6 py-6 max-w-xl">
        <NotificacaoForm modo="criar" processos={processosFormatados} layout={parseUnitLayout(org.unitLayout)} />
      </div>
    </div>
  );
}
