"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrgRouter as useRouter, orgFetch } from "@/lib/org-navigation";
import { useOrganization } from "@/components/org/OrganizationProvider";
import { Building2, Eye, EyeOff, Loader2, AlertCircle, KeyRound } from "lucide-react";

/** O que a tela diz quando o Orken ID volta sem sessão (lib/orken/login.ts). */
const ORKEN_MESSAGES: Record<string, string> = {
  desligado: "A entrada pela conta Orken não está disponível para este condomínio.",
  cancelado: "A entrada pela conta Orken foi cancelada.",
  expirado: "A tentativa de entrada expirou. Tente de novo.",
  mfa: "A gestão exige a verificação em duas etapas da conta Orken.",
  sem_acesso: "Sua conta Orken não tem acesso ao Orken COND deste condomínio. Fale com quem administra a organização.",
  sem_conta:
    "Não há uma conta da gestão deste condomínio com o e-mail da sua conta Orken. Peça a um síndico ou administrador para cadastrá-lo.",
  inativa: "Sua conta na gestão deste condomínio está desativada.",
  indisponivel: "O serviço de acesso está indisponível agora. Tente em alguns minutos.",
  erro: "Não foi possível concluir a entrada. Tente de novo.",
};

export default function LoginForm({ orkenEnabled }: { orkenEnabled: boolean }) {
  const router = useRouter();
  const organization = useOrganization();
  const searchParams = useSearchParams();
  // Volta só para a gestão deste condomínio; qualquer outro destino vira o painel.
  const pedido = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = /^\/admin(?:\/[\w\-/]*)?$/.test(pedido) ? pedido : "/admin/dashboard";
  const orkenMessage = ORKEN_MESSAGES[searchParams.get("orken") ?? ""] ?? null;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(orkenMessage ?? "");
  const [senhaLocal, setSenhaLocal] = useState(!orkenEnabled);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await orgFetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setErro(res.status === 401 ? "E-mail ou senha inválidos. Verifique e tente novamente." : body?.error ?? "Erro ao tentar entrar. Tente novamente.");
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
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Área Administrativa</h1>
            <p className="text-sm text-muted-foreground mt-1">{organization.name}</p>
          </div>

          {erro && (
            <div role="alert" className="flex items-start gap-3 bg-danger-light border border-danger/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {orkenEnabled && (
            <div className="space-y-3">
              {/* Navegação de página inteira: o login segue no Orken ID e volta pelo callback. */}
              <a href={`/entrar/${organization.slug}`} className="btn btn-primary w-full">
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                Entrar com a conta Orken
              </a>
              {!senhaLocal && (
                <button
                  type="button"
                  onClick={() => setSenhaLocal(true)}
                  className="w-full text-sm text-[var(--foreground-muted)] hover:text-foreground underline underline-offset-4 py-2"
                >
                  Acesso com senha local (contas ainda não vinculadas)
                </button>
              )}
            </div>
          )}

          {senhaLocal && (
            <form onSubmit={handleSubmit} noValidate className={orkenEnabled ? "mt-6 pt-6 border-t border-border" : undefined}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="label">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="seu@email.com"
                    required
                    aria-required="true"
                    disabled={carregando}
                  />
                </div>

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
                      {verSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={orkenEnabled ? "btn btn-secondary w-full" : "btn btn-primary w-full"}
                  disabled={carregando || !email || !senha}
                  aria-busy={carregando}
                >
                  {carregando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar com senha"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
