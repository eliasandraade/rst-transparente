"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeletePlanilhaButtonProps {
  id: string;
  nome: string;
}

export default function DeletePlanilhaButton({ id, nome }: DeletePlanilhaButtonProps) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir a planilha "${nome}"? Esta ação não pode ser desfeita.`)) return;

    setExcluindo(true);
    try {
      const res = await fetch(`/api/planilhas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Erro ao excluir planilha.");
        return;
      }
      router.refresh();
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={excluindo}
      className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:bg-danger-light px-2 py-1.5 rounded-md transition-colors disabled:opacity-50"
      aria-label={`Excluir planilha ${nome}`}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      {excluindo ? "Excluindo..." : "Excluir"}
    </button>
  );
}
