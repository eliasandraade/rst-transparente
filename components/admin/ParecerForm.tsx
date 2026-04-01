"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Upload, X, FileText } from "lucide-react";

interface ParecerFormProps {
  initialData?: {
    id: string;
    periodoRef: string;
    titulo: string;
    texto: string;
    dataEmissao: string;
    membrosConselho: string;
    arquivoUrl: string | null;
    arquivoNome: string | null;
    status: "PUBLICADO" | "RASCUNHO";
  };
}

export default function ParecerForm({ initialData }: ParecerFormProps) {
  const router = useRouter();
  const isEdicao = !!initialData;

  const [periodoRef, setPeriodoRef] = useState(initialData?.periodoRef ?? "");
  const [titulo, setTitulo] = useState(initialData?.titulo ?? "");
  const [texto, setTexto] = useState(initialData?.texto ?? "");
  const [dataEmissao, setDataEmissao] = useState(initialData?.dataEmissao ?? "");
  const [membrosConselho, setMembrosConselho] = useState(initialData?.membrosConselho ?? "");
  const [arquivoUrl, setArquivoUrl] = useState(initialData?.arquivoUrl ?? "");
  const [arquivoNome, setArquivoNome] = useState(initialData?.arquivoNome ?? "");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploadando, setUploadando] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleUpload(file: File): Promise<{ url: string; nome: string }> {
    setUploadando(true);
    const formData = new FormData();
    formData.append("arquivo", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Erro ao fazer upload do arquivo");

    const data = await res.json();
    setUploadando(false);
    return { url: data.url, nome: file.name };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      let urlFinal = arquivoUrl;
      let nomeFinal = arquivoNome;

      if (arquivo) {
        const resultado = await handleUpload(arquivo);
        urlFinal = resultado.url;
        nomeFinal = resultado.nome;
      }

      const body = {
        periodoRef,
        titulo: titulo.trim(),
        texto: texto.trim() || null,
        dataEmissao,
        membrosConselho: membrosConselho.trim() || null,
        arquivoUrl: urlFinal || null,
        arquivoNome: nomeFinal || null,
      };

      const url = isEdicao ? `/api/pareceres/${initialData.id}` : "/api/pareceres";
      const method = isEdicao ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar parecer");
      }

      setSucesso(isEdicao ? "Parecer atualizado!" : "Parecer cadastrado!");
      setTimeout(() => router.push("/admin/pareceres"), 1200);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir() {
    if (!isEdicao) return;
    if (!confirm("Tem certeza que deseja excluir este parecer?")) return;
    setCarregando(true);
    try {
      await fetch(`/api/pareceres/${initialData.id}`, { method: "DELETE" });
      router.push("/admin/pareceres");
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

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="periodoRef" className="label">Período de referência *</label>
          <input
            id="periodoRef"
            type="month"
            value={periodoRef}
            onChange={(e) => setPeriodoRef(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label htmlFor="dataEmissao" className="label">Data de emissão *</label>
          <input
            id="dataEmissao"
            type="date"
            value={dataEmissao}
            onChange={(e) => setDataEmissao(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      {/* Título */}
      <div>
        <label htmlFor="titulo" className="label">Título do parecer *</label>
        <input
          id="titulo"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="input"
          placeholder="Ex: Parecer do Conselho Fiscal — Março/2025"
          maxLength={200}
          required
        />
      </div>

      {/* Membros */}
      <div>
        <label htmlFor="membros" className="label">
          Membros do Conselho{" "}
          <span className="text-muted-foreground font-normal">(separados por ponto-e-vírgula)</span>
        </label>
        <input
          id="membros"
          type="text"
          value={membrosConselho}
          onChange={(e) => setMembrosConselho(e.target.value)}
          className="input"
          placeholder="João Silva; Maria Oliveira; Carlos Santos"
        />
      </div>

      {/* Texto do parecer */}
      <div>
        <label htmlFor="texto" className="label">
          Texto do parecer{" "}
          <span className="text-muted-foreground font-normal">(opcional se houver PDF)</span>
        </label>
        <textarea
          id="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="input min-h-[200px] resize-y"
          placeholder="Digite o texto completo do parecer aqui..."
          rows={8}
        />
      </div>

      {/* Upload de PDF */}
      <div>
        <label className="label">
          Arquivo PDF{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>

        {/* PDF existente */}
        {arquivoUrl && !arquivo && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm flex-1">{arquivoNome ?? "Arquivo atual"}</span>
            <button
              type="button"
              onClick={() => { setArquivoUrl(""); setArquivoNome(""); }}
              className="text-muted-foreground hover:text-danger min-h-[auto] p-1"
              aria-label="Remover arquivo atual"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload novo */}
        {arquivo ? (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm flex-1">{arquivo.name}</span>
            <button
              type="button"
              onClick={() => setArquivo(null)}
              className="text-muted-foreground hover:text-danger min-h-[auto] p-1"
              aria-label="Remover arquivo selecionado"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="arquivo"
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              Clique para selecionar um PDF
            </span>
            <span className="text-xs text-muted-foreground">Máximo 10 MB</span>
            <input
              id="arquivo"
              type="file"
              accept=".pdf"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* Botões */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={carregando || uploadando}
        >
          {carregando || uploadando ? (
            <><Loader2 className="w-4 h-4 animate-spin" />
            {uploadando ? "Enviando PDF..." : "Salvando..."}</>
          ) : isEdicao ? (
            "Salvar alterações"
          ) : (
            "Cadastrar parecer"
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
            Excluir parecer
          </button>
        )}
      </div>
    </form>
  );
}
