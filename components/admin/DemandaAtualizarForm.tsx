"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          Demanda atualizada com sucesso.
        </div>
      )}

      <div>
        <label htmlFor="newStatus" className="block text-sm font-medium mb-1">
          Novo status
        </label>
        <select
          id="newStatus"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as DemandStatus)}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Mensagem para o morador <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          maxLength={1000}
          placeholder="Descreva o andamento para o morador..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Esta mensagem aparecerá no histórico público da demanda.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white rounded-lg px-4 py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
        style={{ minHeight: "44px" }}
      >
        {loading ? "Salvando..." : "Salvar atualização"}
      </button>
    </form>
  );
}
