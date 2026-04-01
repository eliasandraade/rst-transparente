"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Config {
  id: string;
  nomeCondominio: string;
  cnpj: string | null;
  endereco: string | null;
}

interface Props {
  config: Config | null;
}

export default function ConfiguracoesForm({ config }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso(false);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      nomeCondominio: (form.elements.namedItem("nomeCondominio") as HTMLInputElement).value.trim(),
      cnpj: (form.elements.namedItem("cnpj") as HTMLInputElement).value.trim(),
      endereco: (form.elements.namedItem("endereco") as HTMLInputElement).value.trim(),
    };

    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao salvar."); return; }
      setSucesso(true);
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {sucesso && (
        <div className="bg-success-light border border-success/30 text-green-700 rounded-md px-4 py-3 text-sm">
          Configurações salvas com sucesso.
        </div>
      )}
      {erro && (
        <div className="bg-danger-light border border-danger/30 text-red-700 rounded-md px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div>
        <label htmlFor="nomeCondominio" className="label">Nome do condomínio</label>
        <input
          id="nomeCondominio"
          name="nomeCondominio"
          type="text"
          required
          defaultValue={config?.nomeCondominio ?? ""}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="cnpj" className="label">CNPJ</label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          defaultValue={config?.cnpj ?? ""}
          className="input"
          placeholder="00.000.000/0000-00"
        />
      </div>

      <div>
        <label htmlFor="endereco" className="label">Endereço</label>
        <input
          id="endereco"
          name="endereco"
          type="text"
          defaultValue={config?.endereco ?? ""}
          className="input"
          placeholder="Rua, número, bairro, cidade"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
