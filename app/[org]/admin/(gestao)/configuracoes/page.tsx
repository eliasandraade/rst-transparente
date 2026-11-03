export const dynamic = "force-dynamic";

import { can, staffSession } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import type { Metadata } from "next";
import ConfiguracoesForm from "@/components/admin/ConfiguracoesForm";
import { orgRedirect } from "@/lib/org-server";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session || !can(session, "configuracoes.editar")) {
    return orgRedirect("/admin/dashboard");
  }

  const config = await db.configPortal.findFirst();

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
