"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

interface EnqueteFormProps {
  enqueteId?: string;
  initialData?: {
    pergunta: string;
    tipo: string;
    status: string;
    dataFim: string;
    opcoes: string[];
  };
}

const DEFAULT_OPCOES = ["", ""];

export default function EnqueteForm({ enqueteId, initialData }: EnqueteFormProps) {
  const router = useRouter();
  const isEditing = !!enqueteId;

  const [pergunta, setPergunta] = useState(initialData?.pergunta ?? "");
  const [tipo, setTipo] = useState(initialData?.tipo ?? "UNICA");
  const [status, setStatus] = useState(initialData?.status ?? "RASCUNHO");
  const [dataFim, setDataFim] = useState(initialData?.dataFim ?? "");
  const [opcoes, setOpcoes] = useState<string[]>(
    initialData?.opcoes && initialData.opcoes.length >= 2
      ? initialData.opcoes
      : DEFAULT_OPCOES
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function addOpcao() {
    if (opcoes.length < 8) setOpcoes([...opcoes, ""]);
  }

  function removeOpcao(index: number) {
    if (opcoes.length <= 2) return;
    setOpcoes(opcoes.filter((_, i) => i !== index));
  }

  function updateOpcao(index: number, valor: string) {
    const novas = [...opcoes];
    novas[index] = valor;
    setOpcoes(novas);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const opcoesValidas = opcoes.filter((o) => o.trim().length > 0);
    if (opcoesValidas.length < 2) {
      setErro("Informe pelo menos 2 opções.");
      return;
    }

    const body: Record<string, unknown> = {
      pergunta,
      tipo,
      status,
      opcoes: opcoesValidas,
    };
    if (dataFim) {
      body.dataFim = new Date(dataFim).toISOString();
    }

    setEnviando(true);
    try {
      const url = isEditing ? `/api/enquetes/${enqueteId}` : "/api/enquetes";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao salvar enquete.");
        return;
      }

      router.push("/admin/enquetes");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Pergunta */}
      <div>
        <label className="label" htmlFor="pergunta-input">
          Pergunta
        </label>
        <input
          id="pergunta-input"
          type="text"
          className="input"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Digite a pergunta da enquete..."
          required
          maxLength={500}
          disabled={enviando}
        />
      </div>

      {/* Tipo e Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tipo-select">
            Tipo de resposta
          </label>
          <select
            id="tipo-select"
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={enviando || isEditing}
          >
            <option value="UNICA">Única escolha</option>
            <option value="MULTIPLA">Múltipla escolha</option>
          </select>
          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1">
              O tipo não pode ser alterado após criação.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="status-select">
            Status
          </label>
          <select
            id="status-select"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={enviando}
          >
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADO">Publicado</option>
          </select>
        </div>
      </div>

      {/* Data fim */}
      <div>
        <label className="label" htmlFor="datafim-input">
          Data de encerramento (opcional)
        </label>
        <input
          id="datafim-input"
          type="datetime-local"
          className="input"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          disabled={enviando}
        />
      </div>

      {/* Opções */}
      {!isEditing && (
        <div>
          <label className="label">
            Opções ({opcoes.length}/8)
          </label>
          <div className="space-y-2">
            {opcoes.map((opcao, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={opcao}
                  onChange={(e) => updateOpcao(index, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                  maxLength={200}
                  disabled={enviando}
                />
                <button
                  type="button"
                  onClick={() => removeOpcao(index)}
                  disabled={opcoes.length <= 2 || enviando}
                  className="p-2 text-muted-foreground hover:text-danger hover:bg-danger-light rounded-md transition-colors disabled:opacity-30"
                  aria-label={`Remover opção ${index + 1}`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {opcoes.length < 8 && (
            <button
              type="button"
              onClick={addOpcao}
              disabled={enviando}
              className="mt-2 flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Adicionar opção
            </button>
          )}
        </div>
      )}

      {erro && (
        <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md" role="alert">
          {erro}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={enviando}>
          {enviando ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar enquete"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/admin/enquetes")}
          disabled={enviando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
