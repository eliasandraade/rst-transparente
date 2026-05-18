export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

import ParecerCard from "@/components/public/ParecerCard";
import type { ParecerPublico } from "@/types";
import type { Metadata } from "next";
import { FileCheck, FileX, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Parecer do Conselho Fiscal",
  description:
    "Leia e baixe o parecer oficial do Conselho Fiscal do Condomínio Residencial Santíssima Trindade.",
};

async function getPareceres(): Promise<ParecerPublico[]> {
  const pareceres = await prisma.parecer.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { periodoRef: "desc" },
  });

  return pareceres.map((p) => ({
    id: p.id,
    periodoRef: p.periodoRef,
    titulo: p.titulo,
    texto: p.texto,
    arquivoUrl: p.arquivoUrl,
    arquivoNome: p.arquivoNome,
    dataEmissao: p.dataEmissao.toISOString(),
    membrosConselho: p.membrosConselho,
  }));
}

export default async function ParecerPage() {
  const pareceres = await getPareceres();
  const [parecerAtual, ...historico] = pareceres;

  return (
    <div className="animate-page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-warning">
              Conselho Fiscal
            </span>
          </div>
          <h1 className="text-2xl sm:text-[1.875rem] font-bold text-foreground tracking-tight leading-tight">
            Parecer Oficial
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mt-2 max-w-lg">
            Documentos oficiais emitidos pelo Conselho Fiscal do condomínio,
            com análise das contas e recomendação formal.
          </p>
        </div>
      </section>

      {/* ── Conteúdo ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {pareceres.length === 0 ? (
          <div className="card text-center py-16">
            <div
              className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4"
              aria-hidden="true"
            >
              <FileX className="w-6 h-6 text-[var(--foreground-subtle)]" />
            </div>
            <p className="text-[var(--foreground-muted)] text-base mb-1.5">
              Nenhum parecer publicado ainda.
            </p>
            <p className="text-sm text-[var(--foreground-subtle)]">
              Os pareceres do Conselho Fiscal serão publicados aqui quando
              disponíveis.
            </p>
          </div>
        ) : (
          <>
            {/* Parecer atual em destaque */}
            {parecerAtual && (
              <section aria-label="Parecer mais recente">
                <ParecerCard parecer={parecerAtual} destaque />
              </section>
            )}

            {/* Histórico */}
            {historico.length > 0 && (
              <section aria-label="Histórico de pareceres">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
                  <h2 className="text-base font-bold text-foreground tracking-tight">
                    Pareceres Anteriores
                  </h2>
                  <span className="badge badge-neutral ml-0.5">
                    {historico.length}
                  </span>
                </div>

                <div className="card divide-y divide-border" role="list">
                  {historico.map((p) => (
                    <div key={p.id} role="listitem">
                      <ParecerCard parecer={p} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Nota institucional */}
        <div className="flex items-start gap-3 bg-[var(--warning-subtle)] border border-[var(--border)] rounded-lg px-4 py-3.5">
          <FileCheck
            className="w-4 h-4 text-warning flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            O Conselho Fiscal é responsável pela análise das contas do
            condomínio e pela emissão de pareceres nos termos da convenção
            condominial. Os documentos publicados aqui são oficiais e têm
            validade formal.
          </p>
        </div>

      </div>
    </div>
  );
}
