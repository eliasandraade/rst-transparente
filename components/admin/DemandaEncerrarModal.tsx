"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface DemandaEncerrarModalProps {
  demandId: string;
}

export default function DemandaEncerrarModal({ demandId }: DemandaEncerrarModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"RESOLVIDA" | "ENCERRADA_SEM_ACAO">("RESOLVIDA");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEncerrar() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/demandas/${demandId}/encerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalStatus, message: message || null }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao encerrar demanda.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="btn btn-secondary w-full"
          style={{ minHeight: "44px" }}
        >
          Encerrar demanda
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-surface border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--danger-subtle)] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-[var(--danger)]" aria-hidden="true" />
              </div>
              <Dialog.Title className="font-bold text-base text-foreground">
                Encerrar demanda
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors"
                style={{ minHeight: "auto" }}
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-sm text-[var(--foreground-muted)] mb-5 leading-relaxed">
            Esta ação finalizará a demanda e registrará o encerramento no histórico.
            Escolha o status final e, se desejar, adicione uma mensagem.
          </p>

          {error && (
            <div
              className="flex items-start gap-3 bg-[var(--danger-subtle)] border border-border rounded-lg px-4 py-3 text-sm text-[var(--danger)] mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label mb-2">
                Status final <span className="text-[var(--danger)]" aria-hidden="true">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border hover:border-primary hover:bg-[var(--primary-subtle)] transition-colors has-[:checked]:border-primary has-[:checked]:bg-[var(--primary-subtle)]">
                  <input
                    type="radio"
                    name="finalStatus"
                    value="RESOLVIDA"
                    checked={finalStatus === "RESOLVIDA"}
                    onChange={() => setFinalStatus("RESOLVIDA")}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Resolvida</div>
                    <div className="text-xs text-[var(--foreground-muted)]">O problema foi tratado e solucionado.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border hover:border-primary hover:bg-[var(--primary-subtle)] transition-colors has-[:checked]:border-primary has-[:checked]:bg-[var(--primary-subtle)]">
                  <input
                    type="radio"
                    name="finalStatus"
                    value="ENCERRADA_SEM_ACAO"
                    checked={finalStatus === "ENCERRADA_SEM_ACAO"}
                    onChange={() => setFinalStatus("ENCERRADA_SEM_ACAO")}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Encerrada sem ação</div>
                    <div className="text-xs text-[var(--foreground-muted)]">Duplicada, fora de escopo ou não será atendida.</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="encerrarMsg" className="label">
                Mensagem final{" "}
                <span className="text-[var(--foreground-subtle)] font-normal">(opcional)</span>
              </label>
              <textarea
                id="encerrarMsg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Explicação adicional para o morador..."
                className="textarea"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="btn btn-secondary flex-1">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              onClick={handleEncerrar}
              disabled={loading}
              className="flex-1 bg-[var(--danger)] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Encerrando...
                </span>
              ) : (
                "Confirmar encerramento"
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
