"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function NovoProcessoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoSync, setAvisoSync] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setAvisoSync(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      numeroProcesso: (fd.get("numeroProcesso") as string).trim(),
      resumoPublico: (fd.get("resumoPublico") as string).trim() || null,
      observacoesInternas: (fd.get("observacoesInternas") as string).trim() || null,
    };

    try {
      const res = await fetch("/api/juridico/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setErro(json.error ?? "Erro ao cadastrar processo.");
        return;
      }

      if (json.avisoSync) {
        setAvisoSync(`Processo salvo, mas a sincronização com DataJud falhou: ${json.avisoSync}`);
      }

      router.push(`/admin/juridico/processos/${json.id}`);
      router.refresh();
    } catch {
      setErro("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div className="flex items-start gap-2.5 bg-[var(--danger-subtle)] border border-border rounded-xl px-4 py-3" role="alert">
          <AlertTriangle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[var(--danger)]">{erro}</p>
        </div>
      )}

      {avisoSync && (
        <div className="flex items-start gap-2.5 bg-[var(--warning-subtle)] border border-border rounded-xl px-4 py-3" role="alert">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[var(--foreground-muted)]">{avisoSync}</p>
        </div>
      )}

      <div>
        <label htmlFor="numeroProcesso" className="label">
          Número do processo <span className="text-[var(--danger)]">*</span>
        </label>
        <input
          id="numeroProcesso"
          name="numeroProcesso"
          required
          placeholder="0000000-00.0000.8.06.0000"
          className="input font-mono tracking-wider"
          autoComplete="off"
        />
        <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
          Formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO. Separadores são opcionais.
        </p>
      </div>

      <div>
        <label htmlFor="resumoPublico" className="label">
          Resumo público
        </label>
        <textarea
          id="resumoPublico"
          name="resumoPublico"
          rows={3}
          maxLength={1000}
          placeholder="Texto que será exibido no portal público (opcional)..."
          className="textarea"
        />
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Visível para moradores. Não inclua dados pessoais.
        </p>
      </div>

      <div>
        <label htmlFor="observacoesInternas" className="label">
          Observações internas
        </label>
        <textarea
          id="observacoesInternas"
          name="observacoesInternas"
          rows={3}
          maxLength={2000}
          placeholder="Anotações internas (nunca público)..."
          className="textarea"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Cadastrando...
            </>
          ) : (
            "Cadastrar e sincronizar"
          )}
        </button>
        <Link href="/admin/juridico/processos" className="btn btn-secondary" style={{ minHeight: "auto" }}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
