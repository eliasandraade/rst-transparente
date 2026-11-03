export const dynamic = "force-dynamic";

import { staffSession } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import type { Metadata } from "next";
import ImportarWizard from "@/components/admin/ImportarWizard";
import { orgRedirect } from "@/lib/org-server";

export const metadata: Metadata = { title: "Importar Planilha" };

export default async function ImportarPage() {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return orgRedirect("/admin/login");

  const categorias = await db.categoria.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, tipo: true },
    orderBy: [{ tipo: "asc" }, { ordem: "asc" }],
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Importar Planilha</h1>
        <p className="text-muted-foreground">
          Envie a planilha de prestação de contas (.xls/.xlsx) para importar os
          lançamentos automaticamente.
        </p>
      </div>

      <ImportarWizard categorias={categorias} />
    </div>
  );
}
