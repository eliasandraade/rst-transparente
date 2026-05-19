"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JuridicoSyncButton() {
  const [estado, setEstado] = useState<"idle" | "loading" | "sucesso" | "erro">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setEstado("loading");
    setMsg(null);

    try {
      const res = await fetch("/api/juridico/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setEstado("erro");
        setMsg(json.error ?? "Erro na sincronização.");
        return;
      }

      setEstado("sucesso");
      setMsg(`${json.sucesso} de ${json.total} processo${json.total !== 1 ? "s" : ""} sincronizado${json.sucesso !== 1 ? "s" : ""}.`);
      router.refresh();
    } catch {
      setEstado("erro");
      setMsg("Falha na conexão com o servidor.");
    } finally {
      setTimeout(() => {
        setEstado("idle");
        setMsg(null);
      }, 6000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={estado === "loading"}
        className="btn btn-secondary btn-sm"
        style={{ minHeight: "auto" }}
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${estado === "loading" ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {estado === "loading" ? "Sincronizando..." : "Sincronizar processos"}
      </button>

      {msg && estado === "sucesso" && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--success)]">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {msg}
        </div>
      )}
      {msg && estado === "erro" && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--danger)]">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {msg}
        </div>
      )}
    </div>
  );
}
