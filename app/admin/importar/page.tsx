export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ImportarWizard from "@/components/admin/ImportarWizard";

export const metadata: Metadata = { title: "Importar Planilha" };

export default async function ImportarPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const categorias = await prisma.categoria.findMany({
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
