"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

type DemandStatus =
  | "RECEBIDA" | "EM_ANALISE" | "EM_ANDAMENTO" | "RESOLVIDA" | "ENCERRADA_SEM_ACAO";

const STATUS_OPTIONS: { value: DemandStatus; label: string }[] = [
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDA", label: "Resolvida" },
  { value: "ENCERRADA_SEM_ACAO", label: "Encerrada sem ação" },
];

interface DemandaAtualizarFormProps {
  demandId: string;
  currentStatus: DemandStatus;
}

export default function DemandaAtualizarForm({
  demandId,
  currentStatus,
}: DemandaAtualizarFormProps) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<DemandStatus>(currentStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/demandas/${demandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, message }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao atualizar demanda.");
        return;
      }

      setSuccess(true);
      setMessage("");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="flex items-start gap-3 bg-[var(--danger-subtle)] border border-border rounded-lg px-4 py-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-[var(--success-subtle)] border border-border rounded-lg px-4 py-3 text-sm text-[var(--success)]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Demanda atualizada com sucesso.
        </div>
      )}

      <div>
        <label htmlFor="newStatus" className="label">
          Novo status
        </label>
        <select
          id="newStatus"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as DemandStatus)}
          className="select"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="label">
          Mensagem para o morador{" "}
          <span className="text-[var(--danger)]" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          maxLength={1000}
          placeholder="Descreva o andamento para o morador..."
          className="textarea"
        />
        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
          Aparecerá no histórico público da demanda.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
        style={{ minHeight: "44px" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Salvando...
          </span>
        ) : (
          "Salvar atualização"
        )}
      </button>
    </form>
  );
}
