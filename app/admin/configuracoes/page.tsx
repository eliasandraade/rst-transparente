export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ConfiguracoesForm from "@/components/admin/ConfiguracoesForm";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session || session.user.role !== "MASTER") {
    redirect("/admin/dashboard");
  }

  const config = await prisma.configPortal.findFirst();

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Configurações</h1>
        <p className="text-muted-foreground">
          Informações gerais exibidas no portal público.
        </p>
      </div>

      <ConfiguracoesForm config={config} />
    </div>
  );
}
