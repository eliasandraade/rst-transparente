"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
      <div className="card text-center py-8 space-y-3">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
        <h3 className="font-semibold text-lg">Proposta enviada!</h3>
        <p className="text-muted-foreground text-sm">
          Sua proposta foi recebida e será analisada pela gestão do condomínio.
        </p>
        <button
          onClick={() => setSucesso(false)}
          className="btn-secondary mt-2"
        >
          Enviar outra proposta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div role="alert" className="flex items-start gap-3 bg-danger-light border border-danger/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{erro}</p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-end mb-1">
          <label htmlFor="texto" className="label">Sua proposta *</label>
          <span className={`text-xs ${texto.length > MAX_TEXTO ? "text-danger" : "text-muted-foreground"}`}>
            {texto.length}/{MAX_TEXTO}
          </span>
        </div>
        <textarea
          id="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="input min-h-[120px] resize-y"
          placeholder="Descreva sua proposta, sugestão ou ideia para o condomínio..."
          maxLength={MAX_TEXTO}
          rows={5}
          required
          minLength={10}
        />
        <p className="text-xs text-muted-foreground mt-1">Mínimo de 10 caracteres.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nome" className="label">
            Nome <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input"
            placeholder="Seu nome (opcional)"
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="unidade" className="label">
            Unidade <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="unidade"
            type="text"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="input"
            placeholder="Apartamento/unidade (opcional)"
            maxLength={20}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={carregando}>
        {carregando ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : (
          "Enviar proposta"
        )}
      </button>
    </form>
  );
}
