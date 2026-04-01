export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avisos e Informativos",
  description: "Acompanhe os avisos e informativos do Condomínio Residencial Santíssima Trindade.",
};

export default async function AvisosPublicPage() {
  const avisos = await prisma.aviso.findMany({
    where: { status: "PUBLICADO" },
    orderBy: [{ fixado: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Avisos e Informativos</h1>
        <p className="text-muted-foreground text-lg">
          Comunicados e informações importantes do condomínio.
        </p>
      </div>

      {avisos.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-muted-foreground text-lg">Nenhum aviso publicado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map((aviso) => (
            <article key={aviso.id} className="card">
              <div className="flex items-start gap-3 mb-2">
                {aviso.fixado && (
                  <span
                    className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap flex-shrink-0 mt-0.5"
                    aria-label="Aviso fixado"
                  >
                    📌 Fixado
                  </span>
                )}
                <h2 className="text-lg font-semibold leading-snug">{aviso.titulo}</h2>
              </div>
              <p className="whitespace-pre-wrap text-foreground leading-relaxed mb-3">
                {aviso.corpo}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatarData(aviso.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
