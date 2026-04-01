export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { UserCircle } from "lucide-react";
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

      {membros.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted-foreground">
            Nenhum membro cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {membros.map((membro) => (
            <div
              key={membro.id}
              className="card flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow"
            >
              {membro.fotoUrl ? (
                <img
                  src={membro.fotoUrl}
                  alt={membro.nome}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/10">
                  <UserCircle className="w-14 h-14 text-primary/40" />
                </div>
              )}
              <div>
                <p className="font-bold text-foreground text-lg leading-tight">
                  {membro.nome}
                </p>
                <p className="text-sm font-semibold text-primary mt-0.5">
                  {membro.cargo}
                </p>
                {membro.descricao && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {membro.descricao}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
