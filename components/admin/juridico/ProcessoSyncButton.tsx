"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProcessoSyncButton({ processoId }: { processoId: string }) {
  const [estado, setEstado] = useState<"idle" | "loading" | "sucesso" | "erro">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setEstado("loading");
    setMsg(null);

    try {
      const res = await fetch(`/api/juridico/processos/${processoId}/sync`, { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setEstado("erro");
        setMsg(json.error ?? "Falha na sincronização.");
        return;
      }

      setEstado("sucesso");
      setMsg("Sincronizado com sucesso.");
      router.refresh();
    } catch {
      setEstado("erro");
      setMsg("Falha na conexão com o servidor.");
    } finally {
      setTimeout(() => { setEstado("idle"); setMsg(null); }, 5000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleSync}
        disabled={estado === "loading"}
        className="btn btn-secondary btn-sm"
        style={{ minHeight: "auto" }}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${estado === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
        {estado === "loading" ? "Sincronizando..." : "Sincronizar"}
      </button>
      {msg && (
        <div className={`flex items-center gap-1 text-xs ${estado === "sucesso" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {estado === "sucesso"
            ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
          {msg}
        </div>
      )}
    </div>
  );
}
