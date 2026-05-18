export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarMoeda } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { PlusCircle, Pencil, HardHat } from "lucide-react";

export const metadata: Metadata = { title: "Obras" };

const STATUS_LABEL: Record<string, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const STATUS_BADGE: Record<string, string> = {
  PLANEJADO: "badge badge-neutral",
  EM_ANDAMENTO: "badge badge-warning",
  CONCLUIDO: "badge badge-success",
  CANCELADO: "badge badge-neutral",
};

function progressoColor(p: number): string {
  if (p <= 33) return "var(--danger)";
  if (p <= 66) return "var(--warning)";
  return "var(--success)";
}

export default async function ObrasAdminPage() {
  const obras = await prisma.obra.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-1">Administração</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Obras e Melhorias</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">Gerencie as obras e projetos do condomínio</p>
        </div>
        <Link href="/admin/obras/novo" className="btn btn-primary">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Nova obra
        </Link>
      </div>

      {obras.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-3">
            <HardHat className="w-5 h-5 text-[var(--foreground-subtle)]" aria-hidden="true" />
          </div>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">Nenhuma obra cadastrada ainda.</p>
          <Link href="/admin/obras/novo" className="btn btn-primary inline-flex">
            <PlusCircle className="w-4 h-4" aria-hidden="true" /> Cadastrar primeira obra
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <div key={obra.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">{obra.titulo}</h2>
                <span className={STATUS_BADGE[obra.status] ?? "badge badge-neutral"}>
                  {STATUS_LABEL[obra.status]}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-1">
                  <span>Progresso</span>
                  <span className="tabular-nums">{obra.progresso}%</span>
                </div>
                <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${obra.progresso}%`,
                      backgroundColor: progressoColor(obra.progresso),
                    }}
                  />
                </div>
              </div>

              {(obra.orcamento || obra.gasto) && (
                <div className="text-xs text-[var(--foreground-muted)] space-y-0.5">
                  {obra.orcamento && (
                    <div>
                      Orçamento:{" "}
                      <span className="text-foreground font-medium tabular-nums">
                        {formatarMoeda(Number(obra.orcamento))}
                      </span>
                    </div>
                  )}
                  {obra.gasto && (
                    <div>
                      Gasto:{" "}
                      <span className="text-foreground font-medium tabular-nums">
                        {formatarMoeda(Number(obra.gasto))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className={`text-xs ${obra.publicado ? "text-[var(--success)]" : "text-[var(--foreground-muted)]"}`}>
                  {obra.publicado ? "Visível ao público" : "Não publicada"}
                </span>
                <Link
                  href={`/admin/obras/${obra.id}`}
                  className="btn btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                  aria-label={`Editar obra: ${obra.titulo}`}
                >
                  <Pencil className="w-3 h-3" aria-hidden="true" /> Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
