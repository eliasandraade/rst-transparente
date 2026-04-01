"use client";

import { useState, useEffect } from "react";
import { BarChart2, CheckCircle, Clock } from "lucide-react";

interface Opcao {
  id: string;
  texto: string;
  ordem: number;
  totalVotos: number;
}

interface EnqueteCardProps {
  enquete: {
    id: string;
    pergunta: string;
    tipo: "UNICA" | "MULTIPLA";
    dataFim: string | null;
    opcoes: Opcao[];
    totalVotos: number;
  };
}

function isEncerrada(dataFim: string | null): boolean {
  if (!dataFim) return false;
  return new Date() > new Date(dataFim);
}

function getVotoKey(enqueteId: string) {
  return `votou_${enqueteId}`;
}

export default function EnqueteCard({ enquete }: EnqueteCardProps) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [jaVotou, setJaVotou] = useState(false);
  const [resultados, setResultados] = useState<Opcao[]>(enquete.opcoes);
  const [totalVotos, setTotalVotos] = useState(enquete.totalVotos);

  const encerrada = isEncerrada(enquete.dataFim);
  const mostrarResultados = jaVotou || encerrada;

  useEffect(() => {
    const votou = localStorage.getItem(getVotoKey(enquete.id));
    if (votou) setJaVotou(true);
  }, [enquete.id]);

  function toggleOpcao(opcaoId: string) {
    if (enquete.tipo === "UNICA") {
      setSelecionados([opcaoId]);
    } else {
      setSelecionados((prev) =>
        prev.includes(opcaoId) ? prev.filter((id) => id !== opcaoId) : [...prev, opcaoId]
      );
    }
  }

  async function handleVotar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (selecionados.length === 0) {
      setErro("Selecione pelo menos uma opção.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`/api/enquetes/${enquete.id}/votar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opcaoIds: selecionados }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Erro ao registrar voto.");
        return;
      }

      // Update results optimistically
      const novasOpcoes = resultados.map((o) => ({
        ...o,
        totalVotos: o.totalVotos + (selecionados.includes(o.id) ? 1 : 0),
      }));
      setResultados(novasOpcoes);
      setTotalVotos(data.totalVotos);

      localStorage.setItem(getVotoKey(enquete.id), "1");
      setJaVotou(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const dataFimFormatada = enquete.dataFim
    ? new Date(enquete.dataFim).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div className="card border-2 border-transparent hover:border-primary/20 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <BarChart2 className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground leading-snug">{enquete.pergunta}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-xs text-muted-foreground">
              {enquete.tipo === "UNICA" ? "Única escolha" : "Múltipla escolha"}
            </span>
            {dataFimFormatada && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {encerrada ? "Encerrada em" : "Encerra em"} {dataFimFormatada}
              </span>
            )}
          </div>
        </div>
      </div>

      {mostrarResultados ? (
        /* Results view */
        <div className="space-y-3">
          {jaVotou && !encerrada && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-success-light px-3 py-2 rounded-md mb-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              Voto registrado com sucesso!
            </div>
          )}
          {resultados.map((opcao) => {
            const pct = totalVotos > 0 ? Math.round((opcao.totalVotos / totalVotos) * 100) : 0;
            const foiSelecionada = selecionados.includes(opcao.id);
            return (
              <div key={opcao.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span
                    className={`font-medium ${foiSelecionada ? "text-primary" : "text-foreground"}`}
                  >
                    {opcao.texto}
                    {foiSelecionada && (
                      <CheckCircle className="w-3.5 h-3.5 inline ml-1 text-primary" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs ml-2 whitespace-nowrap">
                    {opcao.totalVotos} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${foiSelecionada ? "bg-primary" : "bg-primary/40"}`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground text-right mt-2">
            {totalVotos} {totalVotos === 1 ? "voto" : "votos"} no total
          </p>
        </div>
      ) : (
        /* Voting form */
        <form onSubmit={handleVotar} className="space-y-2">
          {enquete.opcoes.map((opcao) => {
            const selecionado = selecionados.includes(opcao.id);
            const inputType = enquete.tipo === "UNICA" ? "radio" : "checkbox";
            return (
              <label
                key={opcao.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border-2 transition-all ${
                  selecionado
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <input
                  type={inputType}
                  name={`enquete-${enquete.id}`}
                  value={opcao.id}
                  checked={selecionado}
                  onChange={() => toggleOpcao(opcao.id)}
                  className="accent-primary"
                  disabled={enviando}
                />
                <span className="text-sm text-foreground">{opcao.texto}</span>
              </label>
            );
          })}

          {erro && (
            <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-3"
            disabled={enviando || selecionados.length === 0}
          >
            {enviando ? "Registrando voto..." : "Votar"}
          </button>
        </form>
      )}
    </div>
  );
}
