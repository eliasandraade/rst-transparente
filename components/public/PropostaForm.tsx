"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Send } from "lucide-react";

export default function PropostaForm() {
  const [texto, setTexto] = useState("");
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const MAX_TEXTO = 1000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      if (texto.trim().length < 10) {
        throw new Error("A proposta deve ter no mínimo 10 caracteres.");
      }

      const res = await fetch("/api/propostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: texto.trim(),
          nome: nome.trim() || null,
          unidade: unidade.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao enviar proposta");
      }

      setSucesso(true);
      setTexto("");
      setNome("");
      setUnidade("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--success-subtle)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-[var(--success)]" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-base text-foreground">Proposta enviada!</h3>
        <p className="text-sm text-[var(--foreground-muted)] max-w-sm mx-auto">
          Sua proposta foi recebida e será analisada pela gestão do condomínio.
        </p>
        <button
          onClick={() => setSucesso(false)}
          className="btn btn-secondary mt-2"
        >
          Enviar outra proposta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-[var(--danger-subtle)] border border-border rounded-lg p-4"
        >
          <AlertCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[var(--danger)]">{erro}</p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-end mb-1.5">
          <label htmlFor="proposta-texto" className="label">
            Sua proposta <span className="text-[var(--danger)]" aria-hidden="true">*</span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              texto.length > MAX_TEXTO
                ? "text-[var(--danger)]"
                : "text-[var(--foreground-subtle)]"
            }`}
            aria-live="polite"
          >
            {texto.length}/{MAX_TEXTO}
          </span>
        </div>
        <textarea
          id="proposta-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="textarea"
          placeholder="Descreva sua proposta, sugestão ou ideia para melhorar o condomínio..."
          maxLength={MAX_TEXTO}
          rows={5}
          required
          minLength={10}
        />
        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
          Mínimo de 10 caracteres.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="proposta-nome" className="label">
            Nome{" "}
            <span className="text-[var(--foreground-subtle)] font-normal">(opcional)</span>
          </label>
          <input
            id="proposta-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input"
            placeholder="Seu nome"
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="proposta-unidade" className="label">
            Unidade{" "}
            <span className="text-[var(--foreground-subtle)] font-normal">(opcional)</span>
          </label>
          <input
            id="proposta-unidade"
            type="text"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="input"
            placeholder="Apartamento / unidade"
            maxLength={20}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={carregando || texto.trim().length < 10}
        >
          {carregando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden="true" />
              Enviar proposta
            </>
          )}
        </button>
        {!carregando && texto.trim().length > 0 && texto.trim().length < 10 && (
          <span className="text-xs text-[var(--foreground-subtle)]">
            {10 - texto.trim().length} caractere{10 - texto.trim().length !== 1 ? "s" : ""} restante{10 - texto.trim().length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </form>
  );
}
