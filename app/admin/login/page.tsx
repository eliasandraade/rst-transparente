"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resultado = await signIn("credentials", {
        email,
        password: senha,
        redirect: false,
      });

      if (resultado?.error) {
        setErro("E-mail ou senha inválidos. Verifique e tente novamente.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErro("Erro ao tentar entrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card de login */}
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Área Administrativa
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Portal da Transparência
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-danger-light border border-danger/30 rounded-lg p-4 mb-6"
            >
              <AlertCircle
                className="w-5 h-5 text-danger flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="label">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  required
                  aria-required="true"
                  disabled={carregando}
                />
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="senha" className="label">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    type={verSenha ? "text" : "password"}
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="input pr-12"
                    placeholder="••••••••"
                    required
                    aria-required="true"
                    disabled={carregando}
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha(!verSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[auto] p-1"
                    aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {verSenha ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={carregando || !email || !senha}
                aria-busy={carregando}
              >
                {carregando ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Acesso restrito ao Conselho Fiscal
        </p>
      </div>
    </div>
  );
}
