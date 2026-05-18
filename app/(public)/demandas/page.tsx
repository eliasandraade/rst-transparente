import Link from "next/link";
import { ClipboardList, Search, Info } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Demandas",
  description:
    "Abra uma solicitação formal ou acompanhe o andamento de uma demanda no Condomínio Residencial Santíssima Trindade.",
};

export default function DemandasHubPage() {
  return (
    <div className="animate-page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Demandas
            </span>
          </div>
          <h1 className="text-2xl sm:text-[1.875rem] font-bold text-foreground tracking-tight leading-tight">
            Central de Demandas
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mt-2">
            Registre solicitações, reclamações ou sugestões e acompanhe o
            andamento com protocolo e código de acesso exclusivos.
          </p>
        </div>
      </section>

      {/* ── CTAs ──────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Abrir demanda */}
          <Link
            href="/demandas/nova"
            className="card-interactive group flex flex-col gap-4 p-6"
            aria-label="Abrir nova demanda"
            style={{ minHeight: "auto" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Nova
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-2.5 mb-2">
                <ClipboardList className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground tracking-tight leading-snug">
                  Abrir Demanda
                </h2>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                Manutenção, reclamação, sugestão ou qualquer solicitação
                formal à gestão.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2.5 transition-all duration-150">
              Registrar agora
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </Link>

          {/* Acompanhar demanda */}
          <Link
            href="/demandas/acompanhar"
            className="card-interactive group flex flex-col gap-4 p-6"
            aria-label="Acompanhar demanda existente"
            style={{ minHeight: "auto" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Consulta
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-2.5 mb-2">
                <Search className="w-5 h-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <h2 className="text-base font-bold text-foreground tracking-tight leading-snug">
                  Acompanhar Demanda
                </h2>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                Consulte o andamento pelo número de protocolo e código de
                acesso recebido.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2.5 transition-all duration-150">
              Consultar
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </Link>
        </div>

        {/* Nota informativa */}
        <div
          className="flex items-start gap-3 bg-[var(--primary-subtle)] border border-border rounded-lg px-4 py-3.5"
          role="note"
        >
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            <strong className="text-foreground font-semibold">Como funciona:</strong>{" "}
            ao abrir uma demanda, você recebe um{" "}
            <strong className="text-foreground">número de protocolo</strong> e
            um{" "}
            <strong className="text-foreground">código de acesso</strong>. Guarde
            essas informações — são necessárias para acompanhar o andamento.
            O código de acesso não pode ser recuperado depois que você sair da
            tela de confirmação.
          </div>
        </div>

      </div>
    </div>
  );
}
