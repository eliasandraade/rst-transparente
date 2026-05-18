"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, AlertTriangle } from "lucide-react";

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
      className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-lg border border-current text-sm font-medium transition-colors w-full justify-center"
      style={{ minHeight: "44px" }}
      aria-label={copied ? "Copiado" : `Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" aria-hidden="true" />
          Copiado com sucesso!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" aria-hidden="true" />
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
      <div className="text-center">
        <CheckCircle2
          className="w-16 h-16 text-green-500 mx-auto mb-3"
          aria-hidden="true"
        />
        <h2 className="text-2xl font-bold text-foreground">
          Demanda registrada!
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Guarde os dados abaixo para acompanhar o andamento da sua solicitação.
        </p>
      </div>

      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-green-700 mb-1">
          📋 Número do Protocolo
        </div>
        <div
          className="text-2xl font-black tracking-wider text-green-800 font-mono"
          aria-label={`Protocolo ${protocol}`}
        >
          {protocol}
        </div>
        <div className="text-green-700">
          <CopyButton text={protocol} label="protocolo" />
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">
          🔑 Código de Acesso
        </div>
        <div
          className="text-2xl font-black tracking-[0.3em] text-amber-900 font-mono"
          aria-label={`Código de acesso ${accessCode}`}
        >
          {accessCode}
        </div>
        <div className="text-amber-700">
          <CopyButton text={accessCode} label="código" />
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 flex gap-3">
        <AlertTriangle
          className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold text-amber-900 text-base">
            Este código será exibido apenas agora.
          </p>
          <p className="text-amber-800 mt-1 leading-relaxed">
            Guarde-o em local seguro. Sem o código de acesso, não será possível
            acompanhar sua demanda. Em caso de perda, entre em contato com a
            gestão/síndico.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ⚠️ <strong>Lembre-se:</strong> o código de acesso não poderá ser
        recuperado depois que você sair desta tela.
      </p>

      <Link
        href={`/demandas/acompanhar?protocol=${encodeURIComponent(protocol)}`}
        className="flex items-center justify-center gap-2 w-full border-2 border-primary text-primary rounded-xl px-6 py-4 font-bold text-base hover:bg-primary/5 transition-colors"
        style={{ minHeight: "56px" }}
      >
        Acompanhar esta demanda
      </Link>

      <Link
        href="/demandas"
        className="flex items-center justify-center w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
      >
        Voltar para a Central de Demandas
      </Link>
    </div>
  );
}
