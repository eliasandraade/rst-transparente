"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface Props {
  id: string;
  status: "PUBLICADO" | "RASCUNHO";
}

export default function PublicarLancamentoButton({ id, status }: Props) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const isPublicado = status === "PUBLICADO";

  async function handleClick() {
    setCarregando(true);
    try {
      await fetch(`/api/lancamentos/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isPublicado ? "RASCUNHO" : "PUBLICADO",
        }),
      });
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={carregando}
      className={`py-1.5 px-3 text-xs rounded-md flex items-center gap-1 transition-colors min-h-[auto] ${
        isPublicado
          ? "bg-muted text-muted-foreground hover:bg-danger-light hover:text-danger"
          : "bg-success-light text-green-700 hover:bg-green-200"
      }`}
      aria-label={isPublicado ? "Despublicar lançamento" : "Publicar lançamento"}
    >
      {carregando ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isPublicado ? (
        <EyeOff className="w-3 h-3" />
      ) : (
        <Eye className="w-3 h-3" />
      )}
      {isPublicado ? "Despublicar" : "Publicar"}
    </button>
  );
}
