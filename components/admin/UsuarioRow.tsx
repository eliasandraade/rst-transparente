"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  ativo: boolean;
  createdAt: Date;
}

interface Props {
  usuario: Usuario;
  labelRole: string;
  sessionRole: string;
  sessionId: string;
}

const COR_ROLE: Record<string, string> = {
  SINDICO: "bg-primary/10 text-primary",
  GESTAO: "bg-warning-light text-yellow-700",
  CONSELHO: "bg-success-light text-green-700",
};

export default function UsuarioRow({ usuario, labelRole, sessionRole, sessionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Pode alterar se: é MASTER, ou é SINDICO e o alvo não é SINDICO/MASTER
  const podeAlterar =
    usuario.id !== sessionId &&
    (sessionRole === "MASTER" ||
      (sessionRole === "SINDICO" && !["SINDICO", "MASTER"].includes(usuario.role)));

  async function toggleAtivo() {
    setLoading(true);
    await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !usuario.ativo }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <tr className={!usuario.ativo ? "opacity-50" : ""}>
      <td className="px-5 py-3.5 font-medium">{usuario.name}</td>
      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{usuario.email}</td>
      <td className="px-5 py-3.5">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${COR_ROLE[usuario.role] ?? "bg-muted text-muted-foreground"}`}>
          {labelRole}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${usuario.ativo ? "bg-success-light text-green-700" : "bg-muted text-muted-foreground"}`}>
          {usuario.ativo ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        {podeAlterar && (
          <button
            onClick={toggleAtivo}
            disabled={loading}
            className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
              usuario.ativo
                ? "border-danger/30 text-red-600 hover:bg-danger-light"
                : "border-success/30 text-green-700 hover:bg-success-light"
            }`}
          >
            {loading ? "..." : usuario.ativo ? "Desativar" : "Reativar"}
          </button>
        )}
      </td>
    </tr>
  );
}
