import { formatarData, formatarPeriodo } from "@/lib/utils";
import type { ParecerPublico } from "@/types";
import { FileText, Download, Users, Calendar } from "lucide-react";

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

  return (
    <article
      className={`card ${destaque ? "border-primary/30 bg-primary/5" : ""}`}
      aria-label={`Parecer do Conselho Fiscal — ${formatarPeriodo(parecer.periodoRef)}`}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              destaque ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
            aria-hidden="true"
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            {destaque && (
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
                Parecer Atual
              </span>
            )}
            <h3 className="font-semibold text-lg leading-tight">{parecer.titulo}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Referente a: {formatarPeriodo(parecer.periodoRef)}
            </p>
          </div>
        </div>

        {/* Botão de download */}
        {parecer.arquivoUrl && (
          <a
            href={parecer.arquivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={parecer.arquivoNome ?? "parecer.pdf"}
            className="btn-primary flex-shrink-0 text-sm"
            aria-label={`Baixar parecer do período ${formatarPeriodo(parecer.periodoRef)} em PDF`}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Baixar PDF
          </a>
        )}
      </div>

      {/* Metadados */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Emitido em {formatarData(parecer.dataEmissao)}</span>
        </div>
        {membros.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>{membros.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Texto do parecer */}
      {parecer.texto && (
        <div className="border-t border-border pt-5">
          <div
            className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap"
            aria-label="Texto do parecer"
          >
            {parecer.texto}
          </div>
        </div>
      )}
    </article>
  );
}
