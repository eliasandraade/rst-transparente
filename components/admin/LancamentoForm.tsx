"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Categoria } from "@prisma/client";

interface LancamentoFormProps {
  categorias: Categoria[];
  initialData?: {
    id: string;
    tipo: "RECEITA" | "DESPESA";
    categoriaId: string;
    descricao: string;
    valor: string;
    data: string;
    fornecedor: string;
    observacoes: string;
    periodo: string;
    status: "PUBLICADO" | "RASCUNHO";
  };
}

export default function LancamentoForm({
  categorias,
  initialData,
}: LancamentoFormProps) {
  const router = useRouter();
  const isEdicao = !!initialData;

  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">(
    initialData?.tipo ?? "DESPESA"
  );
  const [categoriaId, setCategoriaId] = useState(
    initialData?.categoriaId ?? ""
  );
  const [descricao, setDescricao] = useState(initialData?.descricao ?? "");
  const [valor, setValor] = useState(initialData?.valor ?? "");
  const [data, setData] = useState(initialData?.data ?? "");
  const [fornecedor, setFornecedor] = useState(initialData?.fornecedor ?? "");
  const [observacoes, setObservacoes] = useState(
    initialData?.observacoes ?? ""
  );
  const [periodo, setPeriodo] = useState(initialData?.periodo ?? "");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const body = {
        tipo,
        categoriaId,
        descricao: descricao.trim(),
        valor: parseFloat(valor.replace(",", ".")),
        data,
        fornecedor: fornecedor.trim() || null,
        observacoes: observacoes.trim() || null,
        periodo,
      };

      const url = isEdicao
        ? `/api/lancamentos/${initialData.id}`
        : "/api/lancamentos";
      const method = isEdicao ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar lançamento");
      }

      setSucesso(
        isEdicao ? "Lançamento atualizado!" : "Lançamento cadastrado!"
      );
      setTimeout(() => router.push("/admin/lancamentos"), 1200);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir() {
    if (!isEdicao) return;
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;

    setCarregando(true);
    try {
      await fetch(`/api/lancamentos/${initialData.id}`, { method: "DELETE" });
      router.push("/admin/lancamentos");
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Feedback */}
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

      {/* Tipo */}
      <div>
        <fieldset>
          <legend className="label">Tipo de lançamento *</legend>
          <div className="flex gap-3">
            {(["RECEITA", "DESPESA"] as const).map((t) => (
              <label
                key={t}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  tipo === t
                    ? t === "RECEITA"
                      ? "border-success bg-success-light text-green-700"
                      : "border-danger bg-danger-light text-red-700"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={tipo === t}
                  onChange={() => { setTipo(t); setCategoriaId(""); }}
                  className="sr-only"
                />
                {t === "RECEITA" ? "Receita" : "Despesa"}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Grid 2 colunas */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Categoria */}
        <div>
          <label htmlFor="categoria" className="label">Categoria *</label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="input"
            required
          >
            <option value="">Selecione...</option>
            {categoriasFiltradas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Período */}
        <div>
          <label htmlFor="periodo" className="label">Período (AAAA-MM) *</label>
          <input
            id="periodo"
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="input"
            required
          />
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="valor" className="label">Valor (R$) *</label>
          <input
            id="valor"
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="input"
            placeholder="0,00"
            required
          />
        </div>

        {/* Data */}
        <div>
          <label htmlFor="data" className="label">Data *</label>
          <input
            id="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="descricao" className="label">Descrição *</label>
        <input
          id="descricao"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="input"
          placeholder="Ex: Conta de água – março/2025"
          maxLength={200}
          required
        />
      </div>

      {/* Fornecedor (só despesa) */}
      {tipo === "DESPESA" && (
        <div>
          <label htmlFor="fornecedor" className="label">
            Fornecedor / Prestador{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="fornecedor"
            type="text"
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            className="input"
            placeholder="Nome do fornecedor ou empresa"
            maxLength={150}
          />
        </div>
      )}

      {/* Observações */}
      <div>
        <label htmlFor="observacoes" className="label">
          Observações{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="input min-h-[96px] resize-y"
          placeholder="Informações adicionais sobre este lançamento"
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={carregando}>
          {carregando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          ) : isEdicao ? (
            "Salvar alterações"
          ) : (
            "Cadastrar lançamento"
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
            Excluir lançamento
          </button>
        )}
      </div>
    </form>
  );
}
