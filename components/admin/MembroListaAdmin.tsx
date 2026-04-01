"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, Pencil, Trash2, Loader2, Check, X } from "lucide-react";

interface Membro {
  id: string;
  nome: string;
  cargo: string;
  descricao: string | null;
  fotoUrl: string | null;
  ordem: number;
  ativo: boolean;
}

interface Props {
  membros: Membro[];
}

function MembroRow({ membro }: { membro: Membro }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [nome, setNome] = useState(membro.nome);
  const [cargo, setCargo] = useState(membro.cargo);
  const [descricao, setDescricao] = useState(membro.descricao ?? "");
  const [fotoUrl, setFotoUrl] = useState(membro.fotoUrl ?? "");
  const [ordem, setOrdem] = useState(membro.ordem);
  const [ativo, setAtivo] = useState(membro.ativo);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/membros/${membro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        cargo,
        descricao: descricao || null,
        fotoUrl: fotoUrl || null,
        ordem,
        ativo,
      }),
    });
    setSalvando(false);
    setEditando(false);
    router.refresh();
  }

  function cancelar() {
    setNome(membro.nome);
    setCargo(membro.cargo);
    setDescricao(membro.descricao ?? "");
    setFotoUrl(membro.fotoUrl ?? "");
    setOrdem(membro.ordem);
    setAtivo(membro.ativo);
    setEditando(false);
  }

  async function excluir() {
    if (!confirm(`Remover "${membro.nome}" da lista?`)) return;
    setExcluindo(true);
    await fetch(`/api/membros/${membro.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editando) {
    return (
      <div className="py-4 space-y-3 border-b border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input w-full text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Cargo</label>
            <input value={cargo} onChange={(e) => setCargo(e.target.value)} className="input w-full text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="input w-full text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">URL da foto</label>
            <input value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} className="input w-full text-sm" placeholder="https://..." />
          </div>
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ordem</label>
              <input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} className="input w-24 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-1">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4" />
              Ativo
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={salvar} disabled={salvando} className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3">
            {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Salvar
          </button>
          <button onClick={cancelar} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      {membro.fotoUrl ? (
        <img src={membro.fotoUrl} alt={membro.nome} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{membro.nome}</p>
        <p className="text-sm text-primary font-medium">{membro.cargo}</p>
        {membro.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-1">{membro.descricao}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${membro.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
          {membro.ativo ? "Ativo" : "Inativo"}
        </span>
        <span className="text-xs text-muted-foreground">#{membro.ordem}</span>
        <button
          onClick={() => setEditando(true)}
          className="p-2 text-muted-foreground hover:text-primary transition-colors rounded min-h-[auto]"
          aria-label={`Editar ${membro.nome}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={excluir}
          disabled={excluindo}
          className="p-2 text-muted-foreground hover:text-danger transition-colors rounded min-h-[auto]"
          aria-label={`Remover ${membro.nome}`}
        >
          {excluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function MembroListaAdmin({ membros }: Props) {
  if (membros.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum membro cadastrado ainda.</p>;
  }

  return (
    <div>
      {membros.map((m) => (
        <MembroRow key={m.id} membro={m} />
      ))}
    </div>
  );
}
