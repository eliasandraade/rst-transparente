import { formatarData, formatarPeriodo } from "@/lib/utils";
import type { ParecerPublico } from "@/types";
import { FileText, Download, Calendar, Users, CheckCircle } from "lucide-react";

interface ParecerCardProps {
  parecer: ParecerPublico;
  destaque?: boolean;
}

export default function ParecerCard({
  parecer,
  destaque = false,
}: ParecerCardProps) {
  const membros = parecer.membrosConselho
    ? parecer.membrosConselho.split(";").map((m) => m.trim()).filter(Boolean)
    : [];

  const paragrafos = parecer.texto
    ? parecer.texto.split(/\n\n+/).filter(Boolean)
    : [];

  if (destaque) {
    return (
      <article
        className="card"
        aria-label={`Parecer do Conselho Fiscal — ${formatarPeriodo(parecer.periodoRef)}`}
      >
        {/* Topo institucional */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-warning">
              Conselho Fiscal
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--warning-subtle)] px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3 text-warning flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-warning">
              Parecer Atual
            </span>
          </div>
        </div>

        {/* Título + download */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg bg-[var(--warning-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground tracking-tight leading-snug">
                {parecer.titulo}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <span className="text-xs text-[var(--foreground-subtle)]">
                  Período de referência
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {formatarPeriodo(parecer.periodoRef)}
                </span>
              </div>
            </div>
          </div>

          {parecer.arquivoUrl && (
            <a
              href={parecer.arquivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={parecer.arquivoNome ?? "parecer.pdf"}
              className="btn btn-primary flex-shrink-0"
              aria-label={`Baixar parecer de ${formatarPeriodo(parecer.periodoRef)} em PDF`}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Baixar PDF
            </a>
          )}
        </div>

        {/* Metadados */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--foreground-muted)] mb-5 pb-5 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Emitido em {formatarData(parecer.dataEmissao)}</span>
          </div>
          {membros.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span>{membros.length} membro{membros.length !== 1 ? "s" : ""} do Conselho</span>
            </div>
          )}
        </div>

        {/* Texto do parecer */}
        {paragrafos.length > 0 && (
          <div
            className="mb-6 space-y-4"
            aria-label="Texto do parecer"
          >
            {paragrafos.map((p, i) => (
              <p
                key={i}
                className="text-sm text-foreground leading-loose whitespace-pre-wrap"
              >
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Assinaturas */}
        {membros.length > 0 && (
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-3">
              Assinado pelos membros do Conselho Fiscal
            </p>
            <div className="flex flex-wrap gap-2">
              {membros.map((membro, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-raised)] border border-border text-xs font-medium text-[var(--foreground-muted)]"
                >
                  <CheckCircle className="w-3 h-3 text-warning flex-shrink-0" aria-hidden="true" />
                  {membro}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA de download secundário — mobile only, abaixo do texto */}
        {parecer.arquivoUrl && paragrafos.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border sm:hidden">
            <a
              href={parecer.arquivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={parecer.arquivoNome ?? "parecer.pdf"}
              className="btn btn-primary w-full"
              aria-label={`Baixar parecer de ${formatarPeriodo(parecer.periodoRef)} em PDF`}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Baixar PDF
            </a>
          </div>
        )}
      </article>
    );
  }

  /* ── Versão compacta (histórico) ── */
  return (
    <article
      className="py-4 flex items-center justify-between gap-4 flex-wrap"
      aria-label={`Parecer — ${formatarPeriodo(parecer.periodoRef)}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-border flex items-center justify-center flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <FileText className="w-4 h-4 text-[var(--foreground-subtle)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {parecer.titulo}
          </p>
          <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
            {formatarPeriodo(parecer.periodoRef)} · {formatarData(parecer.dataEmissao)}
          </p>
        </div>
      </div>
      {parecer.arquivoUrl && (
        <a
          href={parecer.arquivoUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={parecer.arquivoNome ?? "parecer.pdf"}
          className="btn btn-secondary btn-sm flex-shrink-0"
          aria-label={`Baixar parecer de ${formatarPeriodo(parecer.periodoRef)}`}
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          PDF
        </a>
      )}
    </article>
  );
}
