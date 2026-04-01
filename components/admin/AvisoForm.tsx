"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface AvisoFormProps {
  initialData?: {
    id: string;
    titulo: string;
    corpo: string;
    fixado: boolean;
    status: "RASCUNHO" | "PUBLICADO";
  };
}

export default function AvisoForm({ initialData }: AvisoFormProps) {
  const router = useRouter();
  const isEdicao = !!initialData;

  const [titulo, setTitulo] = useState(initialData?.titulo ?? "");
  const [corpo, setCorpo] = useState(initialData?.corpo ?? "");
  const [fixado, setFixado] = useState(initialData?.fixado ?? false);
  const [status, setStatus] = useState<"RASCUNHO" | "PUBLICADO">(
    initialData?.status ?? "RASCUNHO"
  );

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const body = { titulo: titulo.trim(), corpo: corpo.trim(), fixado, status };
      const url = isEdicao ? `/api/avisos/${initialData.id}` : "/api/avisos";
      const method = isEdicao ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar aviso");
      }

      setSucesso(isEdicao ? "Aviso atualizado!" : "Aviso criado!");
      setTimeout(() => router.push("/admin/avisos"), 1200);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir() {
    if (!isEdicao) return;
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

    setCarregando(true);
    try {
      await fetch(`/api/avisos/${initialData.id}`, { method: "DELETE" });
      router.push("/admin/avisos");
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
        <label htmlFor="titulo" className="label">Título *</label>
        <input
          id="titulo"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="input"
          placeholder="Ex: Manutenção da área de lazer"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label htmlFor="corpo" className="label">Conteúdo *</label>
        <textarea
          id="corpo"
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          className="input min-h-[160px] resize-y"
          placeholder="Digite o texto do aviso..."
          rows={6}
          required
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "RASCUNHO" | "PUBLICADO")}
            className="input w-auto"
          >
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADO">Publicado</option>
          </select>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fixado}
              onChange={(e) => setFixado(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-medium">Fixar no topo</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={carregando}>
          {carregando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          ) : isEdicao ? (
            "Salvar alterações"
          ) : (
            "Criar aviso"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={carregando}
        >
          Cancelar
        </button>
        {isEdicao && (
          <button
            type="button"
            onClick={handleExcluir}
            className="ml-auto text-sm text-danger hover:underline min-h-[44px] px-2"
            disabled={carregando}
          >
            Excluir aviso
          </button>
        )}
      </div>
    </form>
  );
}
