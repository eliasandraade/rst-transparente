"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type StatusProposta = "PENDENTE" | "ANALISANDO" | "RESPONDIDA" | "ARQUIVADA";

interface Props {
  id: string;
  statusAtual: StatusProposta;
  respostaAtual: string;
}

export default function PropostaRespostaForm({ id, statusAtual, respostaAtual }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusProposta>(statusAtual);
  const [resposta, setResposta] = useState(respostaAtual);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const res = await fetch(`/api/propostas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resposta: resposta.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao atualizar proposta");
      }

      setSucesso("Proposta atualizada!");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div role="alert" className="flex items-start gap-3 bg-danger-light border border-danger/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{erro}</p>
        </div>
      )}
      {sucesso && (
        <div role="status" className="flex items-center gap-3 bg-success-light border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-green-700" />
          <p className="text-sm text-green-800">{sucesso}</p>
        </div>
      )}

      <div>
        <label htmlFor="status" className="label">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusProposta)}
          className="input w-auto"
        >
          <option value="PENDENTE">Pendente</option>
          <option value="ANALISANDO">Analisando</option>
          <option value="RESPONDIDA">Respondida</option>
          <option value="ARQUIVADA">Arquivada</option>
        </select>
      </div>

      <div>
        <label htmlFor="resposta" className="label">
          Resposta <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="resposta"
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          className="input min-h-[120px] resize-y"
          placeholder="Escreva uma resposta para o morador..."
          rows={5}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={carregando}>
        {carregando ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
        ) : (
          "Salvar"
        )}
      </button>
    </form>
  );
}
