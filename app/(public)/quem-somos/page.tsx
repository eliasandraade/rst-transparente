export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import QuemSomosCliente from "@/components/public/QuemSomosCliente";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem Somos",
  description:
    "Conheça os membros da gestão, conselho fiscal e síndico do Condomínio Residencial Santíssima Trindade.",
};

export default async function QuemSomosPage() {
  const membros = await prisma.membro.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Quem Somos</h1>
        <p className="text-muted-foreground text-lg">
          Conheça as pessoas responsáveis pela gestão do condomínio.
        </p>
      </div>

      <QuemSomosCliente membros={membros} />
    </div>
  );
}
