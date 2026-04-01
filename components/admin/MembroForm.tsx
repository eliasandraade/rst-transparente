"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

export default function MembroForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [ordem, setOrdem] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cargo,
          descricao: descricao || null,
          fotoUrl: fotoUrl || null,
          ordem,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao salvar");
      } else {
        setNome("");
        setCargo("");
        setDescricao("");
        setFotoUrl("");
        setOrdem(0);
        router.refresh();
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          maxLength={100}
          className="input w-full"
          placeholder="Ex: João Silva"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cargo *</label>
        <input
          type="text"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          required
          maxLength={100}
          className="input w-full"
          placeholder="Ex: Síndico, Conselheiro Fiscal"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium mb-1">Descrição breve</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={500}
          rows={2}
          className="input w-full resize-none"
          placeholder="Breve descrição ou mensagem do membro (opcional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link da foto (URL)</label>
        <input
          type="url"
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          className="input w-full"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ordem de exibição</label>
        <input
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(Number(e.target.value))}
          min={0}
          className="input w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">Menor número aparece primeiro</p>
      </div>

      {erro && <p className="sm:col-span-2 text-sm text-danger font-medium">{erro}</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {salvando ? "Salvando..." : "Adicionar membro"}
        </button>
      </div>
    </form>
  );
}
