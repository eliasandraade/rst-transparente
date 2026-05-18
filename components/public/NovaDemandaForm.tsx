"use client";

import { useState, useRef } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";

const CATEGORIAS = [
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "BARULHO", label: "Barulho" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "VAZAMENTO", label: "Vazamento" },
  { value: "SUGESTAO", label: "Sugestão" },
  { value: "RECLAMACAO", label: "Reclamação" },
  { value: "OUTROS", label: "Outros" },
];

interface DemandaSuccessData {
  protocol: string;
  accessCode: string;
}

interface NovaDemandaFormProps {
  onSuccess: (data: DemandaSuccessData) => void;
}

export default function NovaDemandaForm({ onSuccess }: NovaDemandaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [descCount, setDescCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Formato inválido. Use JPG, PNG ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploadingFile(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Falha no upload");
      const json = await res.json();
      setAttachmentUrl(json.url);
      setAttachmentName(file.name);
    } catch {
      setError("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploadingFile(false);
    }
  }

  function removeAttachment() {
    setAttachmentUrl(null);
    setAttachmentName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: fd.get("requesterName"),
          unit: fd.get("unit"),
          phone: fd.get("phone"),
          email: fd.get("email") || null,
          category: fd.get("category"),
          title: fd.get("title"),
          description: fd.get("description"),
          attachmentUrl,
          attachmentName,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao enviar demanda.");
        return;
      }
      onSuccess({ protocol: json.protocol, accessCode: json.accessCode });
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="flex items-start gap-3 bg-[var(--danger-subtle)] border border-border rounded-lg px-4 py-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Dados do solicitante */}
      <fieldset>
        <legend className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
          Seus dados
        </legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="requesterName" className="label">
              Nome completo{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>
            </label>
            <input
              id="requesterName"
              name="requesterName"
              type="text"
              required
              autoComplete="name"
              className="input"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="unit" className="label">
              Apartamento / Unidade{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>
            </label>
            <input
              id="unit"
              name="unit"
              type="text"
              required
              className="input"
              placeholder="Ex: Apto 204, Bloco B 101"
            />
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Telefone{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="input"
              placeholder="(11) 9 8765-4321"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              E-mail{" "}
              <span className="text-[var(--foreground-subtle)] text-xs font-normal">(opcional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="input"
              placeholder="seu@email.com"
            />
          </div>
        </div>
      </fieldset>

      {/* Detalhes da demanda */}
      <fieldset>
        <legend className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
          Sobre a demanda
        </legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="category" className="label">
              Categoria{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              className="select"
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="label">
              Título{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={120}
              className="input"
              placeholder="Resumo em poucas palavras"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Descrição{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              maxLength={2000}
              className="textarea"
              placeholder="Descreva o problema com detalhes: local, quando começou, frequência..."
              onChange={(e) => setDescCount(e.target.value.length)}
            />
            <p
              className="text-xs text-[var(--foreground-subtle)] text-right mt-1 tabular-nums"
              aria-live="polite"
            >
              {descCount}/2000
            </p>
          </div>
        </div>
      </fieldset>

      {/* Anexo */}
      <fieldset>
        <legend className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
          Anexo{" "}
          <span className="font-normal normal-case">(opcional)</span>
        </legend>

        {attachmentName ? (
          <div className="flex items-center gap-3 bg-[var(--primary-subtle)] border border-border rounded-lg px-4 py-3">
            <Paperclip className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-foreground flex-1 truncate">{attachmentName}</span>
            <button
              type="button"
              onClick={removeAttachment}
              className="text-[var(--foreground-muted)] hover:text-[var(--danger)] transition-colors"
              aria-label="Remover anexo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg px-4 py-6 cursor-pointer hover:border-primary hover:bg-[var(--primary-subtle)] transition-colors text-center">
            {uploadingFile ? (
              <Loader2 className="w-6 h-6 text-[var(--foreground-muted)] mb-2 animate-spin" aria-hidden="true" />
            ) : (
              <Paperclip className="w-6 h-6 text-[var(--foreground-muted)] mb-2" aria-hidden="true" />
            )}
            <span className="text-sm font-medium text-[var(--foreground-muted)]">
              {uploadingFile ? "Enviando..." : "Foto ou documento"}
            </span>
            <span className="text-xs text-[var(--foreground-subtle)] mt-1">
              JPG, PNG ou PDF · máx. 10MB
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadingFile}
            />
          </label>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={loading || uploadingFile}
        className="btn btn-primary w-full"
        style={{ minHeight: "48px" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Enviando...
          </span>
        ) : (
          "Enviar Demanda"
        )}
      </button>
    </form>
  );
}
