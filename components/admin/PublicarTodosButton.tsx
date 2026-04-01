"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

interface Props {
  periodo: string;
  totalRascunhos: number;
}

export default function PublicarTodosButton({ periodo, totalRascunhos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (totalRascunhos === 0) return null;

  async function handleClick() {
    if (!confirm(`Publicar todos os ${totalRascunhos} rascunhos de ${periodo}? Eles ficarão visíveis no portal público.`)) return;

    setLoading(true);
    await fetch("/api/lancamentos/publicar-todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodo }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary flex items-center gap-2"
    >
      <CheckCheck className="w-4 h-4" />
      {loading ? "Publicando..." : `Publicar todos (${totalRascunhos})`}
    </button>
  );
}
