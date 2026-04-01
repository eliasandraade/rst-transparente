"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatarPeriodo } from "@/lib/utils";
import { Upload } from "lucide-react";

interface UploadPlanilhaFormProps {
  periodos: string[];
}

export default function UploadPlanilhaForm({ periodos }: UploadPlanilhaFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [periodo, setPeriodo] = useState(periodos[0] ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    const arquivo = fileRef.current?.files?.[0];
    if (!arquivo) {
      setErro("Selecione um arquivo.");
      return;
    }
    if (!periodo) {
      setErro("Selecione um período.");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("periodo", periodo);

      const res = await fetch("/api/planilhas", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao fazer upload.");
        return;
      }

      setSucesso(true);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="periodo-select">
            Período
          </label>
          <select
            id="periodo-select"
            className="input"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            disabled={enviando}
          >
            {periodos.map((p) => (
              <option key={p} value={p}>
                {formatarPeriodo(p)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="arquivo-input">
            Arquivo (.xls ou .xlsx)
          </label>
          <input
            id="arquivo-input"
            ref={fileRef}
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="input"
            disabled={enviando}
            required
          />
        </div>
      </div>

      {erro && (
        <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md" role="alert">
          {erro}
        </p>
      )}

      {sucesso && (
        <p className="text-sm text-green-700 bg-success-light px-3 py-2 rounded-md" role="status">
          Planilha enviada com sucesso!
        </p>
      )}

      <button
        type="submit"
        className="btn-primary flex items-center gap-2"
        disabled={enviando}
      >
        <Upload className="w-4 h-4" aria-hidden="true" />
        {enviando ? "Enviando..." : "Fazer upload"}
      </button>
    </form>
  );
}
