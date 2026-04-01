"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type StatusObra = "PLANEJADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

interface ObraFormProps {
  initialData?: {
    id: string;
    titulo: string;
    descricao: string;
    orcamento: string;
    gasto: string;
    status: StatusObra;
    progresso: number;
    dataInicio: string;
    dataPrevista: string;
    imagemUrl: string;
    publicado: boolean;
  };
}

export default function ObraForm({ initialData }: ObraFormProps) {
  const router = useRouter();
  const isEdicao = !!initialData;

  const [titulo, setTitulo] = useState(initialData?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialData?.descricao ?? "");
  const [orcamento, setOrcamento] = useState(initialData?.orcamento ?? "");
  const [gasto, setGasto] = useState(initialData?.gasto ?? "");
  const [status, setStatus] = useState<StatusObra>(initialData?.status ?? "PLANEJADO");
  const [progresso, setProgresso] = useState(initialData?.progresso ?? 0);
  const [dataInicio, setDataInicio] = useState(initialData?.dataInicio ?? "");
  const [dataPrevista, setDataPrevista] = useState(initialData?.dataPrevista ?? "");
  const [imagemUrl, setImagemUrl] = useState(initialData?.imagemUrl ?? "");
  const [publicado, setPublicado] = useState(initialData?.publicado ?? false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const body = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        orcamento: orcamento ? parseFloat(orcamento.replace(",", ".")) : null,
        gasto: gasto ? parseFloat(gasto.replace(",", ".")) : null,
        status,
        progresso: Number(progresso),
        dataInicio: dataInicio || null,
        dataPrevista: dataPrevista || null,
        imagemUrl: imagemUrl.trim() || null,
        publicado,
      };

      const url = isEdicao ? `/api/obras/${initialData.id}` : "/api/obras";
      const method = isEdicao ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar obra");
      }

      setSucesso(isEdicao ? "Obra atualizada!" : "Obra criada!");
      setTimeout(() => router.push("/admin/obras"), 1200);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir() {
    if (!isEdicao) return;
    if (!confirm("Tem certeza que deseja excluir esta obra?")) return;

    setCarregando(true);
    try {
      await fetch(`/api/obras/${initialData.id}`, { method: "DELETE" });
      router.push("/admin/obras");
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  const progressoColor =
    progresso <= 33
      ? "bg-red-500"
      : progresso <= 66
      ? "bg-yellow-500"
      : "bg-green-500";

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
          placeholder="Ex: Reforma da piscina"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label htmlFor="descricao" className="label">
          Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="input min-h-[96px] resize-y"
          placeholder="Descreva os detalhes da obra..."
          rows={3}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusObra)}
            className="input"
          >
            <option value="PLANEJADO">Planejado</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div>
          <label htmlFor="progresso" className="label">Progresso: {progresso}%</label>
          <input
            id="progresso"
            type="number"
            min={0}
            max={100}
            value={progresso}
            onChange={(e) => setProgresso(Number(e.target.value))}
            className="input"
          />
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressoColor}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="orcamento" className="label">
            Orçamento (R$) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="orcamento"
            type="number"
            step="0.01"
            min="0.01"
            value={orcamento}
            onChange={(e) => setOrcamento(e.target.value)}
            className="input"
            placeholder="0,00"
          />
        </div>

        <div>
          <label htmlFor="gasto" className="label">
            Gasto até agora (R$) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="gasto"
            type="number"
            step="0.01"
            min="0"
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
            className="input"
            placeholder="0,00"
          />
        </div>

        <div>
          <label htmlFor="dataInicio" className="label">
            Data de início <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="dataPrevista" className="label">
            Data prevista de conclusão <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="dataPrevista"
            type="date"
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="imagemUrl" className="label">
          URL da imagem <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          id="imagemUrl"
          type="url"
          value={imagemUrl}
          onChange={(e) => setImagemUrl(e.target.value)}
          className="input"
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm font-medium">Publicar para moradores</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={carregando}>
          {carregando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          ) : isEdicao ? (
            "Salvar alterações"
          ) : (
            "Criar obra"
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
            Excluir obra
          </button>
        )}
      </div>
    </form>
  );
}
