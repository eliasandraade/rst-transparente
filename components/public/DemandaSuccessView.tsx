"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, AlertTriangle, FileSearch } from "lucide-react";

interface DemandaSuccessViewProps {
  protocol: string;
  accessCode: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleCopy}
      className="btn btn-secondary btn-sm w-full mt-2"
      aria-label={copied ? "Copiado" : `Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          Copiar {label}
        </>
      )}
    </button>
  );
}

export default function DemandaSuccessView({
  protocol,
  accessCode,
}: DemandaSuccessViewProps) {
  return (
    <div className="space-y-5">
      {/* Confirmação */}
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-[var(--success-subtle)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-[var(--success)]" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Demanda registrada
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mt-1.5 leading-relaxed">
          Guarde os dados abaixo para acompanhar o andamento da sua solicitação.
        </p>
      </div>

      {/* Protocolo */}
      <div className="border border-border rounded-xl p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--success)]">
            Número do Protocolo
          </span>
        </div>
        <p
          className="text-2xl font-black tracking-wider font-mono tabular-nums text-foreground"
          aria-label={`Protocolo ${protocol}`}
        >
          {protocol}
        </p>
        <CopyButton text={protocol} label="protocolo" />
      </div>

      {/* Código de acesso */}
      <div className="border border-border rounded-xl p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--warning)]">
            Código de Acesso
          </span>
        </div>
        <p
          className="text-2xl font-black tracking-[0.3em] font-mono tabular-nums text-foreground"
          aria-label={`Código de acesso ${accessCode}`}
        >
          {accessCode}
        </p>
        <CopyButton text={accessCode} label="código" />
      </div>

      {/* Alerta irrecuperável */}
      <div
        className="flex items-start gap-3 bg-[var(--warning-subtle)] border border-border rounded-xl px-4 py-4"
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle
          className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-bold text-foreground">
            Este código será exibido apenas agora.
          </p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
            Guarde-o em local seguro. Sem o código de acesso, não será possível
            acompanhar sua demanda. Em caso de perda, entre em contato com a
            gestão.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <Link
        href={`/demandas/acompanhar?protocol=${encodeURIComponent(protocol)}`}
        className="btn btn-primary w-full"
        style={{ minHeight: "48px" }}
      >
        <FileSearch className="w-4 h-4" aria-hidden="true" />
        Acompanhar esta demanda
      </Link>

      <Link
        href="/demandas"
        className="flex items-center justify-center w-full text-[var(--foreground-muted)] text-sm py-2 hover:text-foreground transition-colors duration-150"
      >
        Voltar para a Central de Demandas
      </Link>
    </div>
  );
}
