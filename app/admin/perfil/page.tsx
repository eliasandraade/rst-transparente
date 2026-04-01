import { auth } from "@/lib/auth";
import AlterarSenhaForm from "@/components/admin/AlterarSenhaForm";
import { UserCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meu Perfil" };

const ROLE_LABELS: Record<string, string> = {
  MASTER: "Master",
  SINDICO: "Síndico",
  GESTAO: "Gestão",
  CONSELHO: "Conselho Fiscal",
};

export default async function PerfilPage() {
  const session = await auth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informações da sua conta e segurança.
        </p>
      </div>

      {/* Info do usuário */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{session?.user.name}</p>
          <p className="text-sm text-muted-foreground">{session?.user.email}</p>
          <span className="inline-block mt-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {ROLE_LABELS[session?.user.role ?? ""] ?? session?.user.role}
          </span>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Alterar senha</h2>
        <AlterarSenhaForm />
      </div>
    </div>
  );
}
