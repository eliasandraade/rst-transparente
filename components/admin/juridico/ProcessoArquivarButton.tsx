"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";

interface Props {
  processoId: string;
  ativo: boolean;
}

export default function ProcessoArquivarButton({ processoId, ativo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function executar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/juridico/processos/${processoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ativo: !ativo,
          observacao: ativo ? "Arquivado pelo admin" : "Reativado pelo admin",
        }),
      });
      if (res.ok) {
        router.refresh();
        setConfirmar(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className={`btn btn-sm ${ativo ? "btn-secondary" : "btn-secondary"} flex items-center gap-1.5`}
        style={{ minHeight: "auto" }}
      >
        {ativo ? (
          <><Archive className="w-3.5 h-3.5" aria-hidden="true" />Arquivar</>
        ) : (
          <><ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" />Reativar</>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[var(--surface-raised)] border border-border rounded-xl px-3 py-1.5">
      <span className="text-xs text-[var(--foreground-muted)]">
        {ativo ? "Arquivar processo?" : "Reativar processo?"}
      </span>
      <button
        onClick={executar}
        disabled={loading}
        className="btn btn-sm btn-primary"
        style={{ minHeight: "auto" }}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : "Confirmar"}
      </button>
      <button
        onClick={() => setConfirmar(false)}
        className="btn btn-sm btn-secondary"
        style={{ minHeight: "auto" }}
      >
        Cancelar
      </button>
    </div>
  );
}
