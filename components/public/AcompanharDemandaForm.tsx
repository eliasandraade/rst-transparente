"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface AcompanharDemandaFormProps {
  defaultProtocol?: string;
}

export default function AcompanharDemandaForm({
  defaultProtocol = "",
}: AcompanharDemandaFormProps) {
  const router = useRouter();
  const [protocol, setProtocol] = useState(defaultProtocol);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/demandas/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: protocol.trim().toUpperCase(),
          accessCode: accessCode.trim().toUpperCase(),
        }),
      });

      if (res.status === 429) {
        setError("Muitas tentativas. Aguarde 1 minuto e tente novamente.");
        return;
      }

      if (!res.ok) {
        setError("Protocolo ou código inválido. Verifique os dados e tente novamente.");
        return;
      }

      const data = await res.json();
      sessionStorage.setItem(`demand-${protocol.trim().toUpperCase()}`, JSON.stringify(data));
      router.push(`/demandas/acompanhar/${encodeURIComponent(protocol.trim().toUpperCase())}`);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="flex items-start gap-3 bg-[var(--danger-subtle)] border border-border rounded-lg px-4 py-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="protocol" className="label">
          Número do Protocolo{" "}
          <span className="text-[var(--danger)]" aria-hidden="true">*</span>
        </label>
        <input
          id="protocol"
          type="text"
          required
          value={protocol}
          onChange={(e) => setProtocol(e.target.value.toUpperCase())}
          className="input font-mono tracking-wider uppercase"
          placeholder="Ex: RST-2026-K7M9Q2"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
          O protocolo começa com RST- seguido do ano e um código.
        </p>
      </div>

      <div>
        <label htmlFor="accessCode" className="label">
          Código de Acesso{" "}
          <span className="text-[var(--danger)]" aria-hidden="true">*</span>
        </label>
        <input
          id="accessCode"
          type="text"
          required
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          className="input font-mono tracking-[0.3em] uppercase"
          placeholder="Ex: X7K9P2"
          maxLength={8}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
          Não diferencia maiúsculas e minúsculas.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
        style={{ minHeight: "48px" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Consultando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Search className="w-4 h-4" aria-hidden="true" />
            Consultar Demanda
          </span>
        )}
      </button>

      <p className="text-center text-xs text-[var(--foreground-muted)] leading-relaxed">
        Não encontrou? Verifique se o protocolo está correto ou{" "}
        <strong className="text-foreground">entre em contato com a gestão</strong>.
      </p>
    </form>
  );
}
