"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

interface RoleOption {
  value: string;
  label: string;
}

interface Props {
  rolesCriáveis: RoleOption[];
}

export default function NovoUsuarioForm({ rolesCriáveis }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      role: (form.elements.namedItem("role") as HTMLSelectElement).value,
    };

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao criar usuário.");
        return;
      }

      router.push("/admin/usuarios");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {erro && (
        <div className="bg-danger-light border border-danger/30 text-red-700 rounded-md px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div>
        <label htmlFor="name" className="label">Nome completo</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={3}
          autoComplete="off"
          className="input"
          placeholder="Ex: João da Silva"
        />
      </div>

      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="input"
          placeholder="joao@email.com"
        />
      </div>

      <div>
        <label htmlFor="role" className="label">Perfil</label>
        <select id="role" name="role" required className="input">
          {rolesCriáveis.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="password" className="label">Senha inicial</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={mostrarSenha ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="input pr-10"
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Informe ao usuário — ele poderá trocar após o login.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Criando..." : "Criar usuário"}
        </button>
        <Link href="/admin/usuarios" className="btn-secondary flex-1 text-center">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
