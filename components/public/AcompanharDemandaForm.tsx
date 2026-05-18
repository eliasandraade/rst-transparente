"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="protocol" className="block text-sm font-bold mb-1">
          Número do Protocolo <span className="text-red-500">*</span>
        </label>
        <input
          id="protocol"
          type="text"
          required
          value={protocol}
          onChange={(e) => setProtocol(e.target.value.toUpperCase())}
          className="w-full border-2 border-border rounded-xl px-4 py-4 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary bg-background uppercase"
          placeholder="Ex: RST-2026-K7M9Q2"
          style={{ minHeight: "56px" }}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          O protocolo começa com RST- seguido do ano e um código.
        </p>
      </div>

      <div>
        <label htmlFor="accessCode" className="block text-sm font-bold mb-1">
          Código de Acesso <span className="text-red-500">*</span>
        </label>
        <input
          id="accessCode"
          type="text"
          required
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          className="w-full border-2 border-border rounded-xl px-4 py-4 text-base font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary bg-background uppercase"
          placeholder="Ex: X7K9P2"
          maxLength={8}
          style={{ minHeight: "56px" }}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Não diferencia maiúsculas e minúsculas.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white rounded-xl px-6 py-4 font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60"
        style={{ minHeight: "56px" }}
      >
        {loading ? "Consultando..." : (
          <span className="flex items-center justify-center gap-2">
            <Search className="w-5 h-5" aria-hidden="true" />
            Consultar Demanda
          </span>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Não encontrou? Verifique se o protocolo está correto ou{" "}
        <strong>entre em contato com a gestão/síndico</strong>.
      </p>
    </form>
  );
}
