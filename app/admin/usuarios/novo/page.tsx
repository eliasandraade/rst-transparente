export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import NovoUsuarioForm from "@/components/admin/NovoUsuarioForm";

export const metadata: Metadata = { title: "Novo Usuário" };

export default async function NovoUsuarioPage() {
  const session = await auth();
  if (!session || !["MASTER", "SINDICO"].includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  // Roles que este usuário pode criar
  const rolesCriáveis =
    session.user.role === "MASTER"
      ? [
          { value: "SINDICO", label: "Síndico" },
          { value: "GESTAO", label: "Gestão" },
          { value: "CONSELHO", label: "Conselheiro" },
        ]
      : [
          { value: "GESTAO", label: "Gestão" },
          { value: "CONSELHO", label: "Conselheiro" },
        ];

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Novo Usuário</h1>
        <p className="text-muted-foreground">
          Preencha os dados para criar o acesso. O usuário poderá alterar a
          senha após o primeiro login.
        </p>
      </div>

      <NovoUsuarioForm rolesCriáveis={rolesCriáveis} />
    </div>
  );
}
