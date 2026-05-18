"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface DemandaEncerrarModalProps {
  demandId: string;
}

export default function DemandaEncerrarModal({
  demandId,
}: DemandaEncerrarModalProps) {
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
          className="w-full border border-border text-muted-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
          style={{ minHeight: "44px" }}
        >
          Encerrar demanda
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
              <Dialog.Title className="font-bold text-base">
                Encerrar demanda
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Esta ação finalizará a demanda e registrará o encerramento no
            histórico. Escolha o status final e, se desejar, adicione uma
            mensagem.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Status final <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="finalStatus"
                    value="RESOLVIDA"
                    checked={finalStatus === "RESOLVIDA"}
                    onChange={() => setFinalStatus("RESOLVIDA")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">Resolvida</div>
                    <div className="text-xs text-muted-foreground">O problema foi tratado e solucionado.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="finalStatus"
                    value="ENCERRADA_SEM_ACAO"
                    checked={finalStatus === "ENCERRADA_SEM_ACAO"}
                    onChange={() => setFinalStatus("ENCERRADA_SEM_ACAO")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">Encerrada sem ação</div>
                    <div className="text-xs text-muted-foreground">Demanda duplicada, fora de escopo ou não será atendida.</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="encerrarMsg" className="block text-sm font-medium mb-1">
                Mensagem final <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <textarea
                id="encerrarMsg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Explicação adicional para o morador..."
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              onClick={handleEncerrar}
              disabled={loading}
              className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Encerrando..." : "Confirmar encerramento"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
