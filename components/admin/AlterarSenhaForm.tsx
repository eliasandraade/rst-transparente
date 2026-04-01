"use client";

import { useState } from "react";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";

export default function AlterarSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao alterar senha");
      } else {
        setSucesso(true);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Senha atual
        </label>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
          className="input w-full"
          autoComplete="current-password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Nova senha
        </label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          minLength={8}
          className="input w-full"
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Confirmar nova senha
        </label>
        <input
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
          className="input w-full"
          autoComplete="new-password"
        />
      </div>

      {erro && (
        <p className="text-sm text-danger font-medium">{erro}</p>
      )}

      {sucesso && (
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
          <CheckCircle className="w-4 h-4" />
          Senha alterada com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={salvando}
        className="btn-primary flex items-center gap-2"
      >
        {salvando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <KeyRound className="w-4 h-4" />
        )}
        {salvando ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
