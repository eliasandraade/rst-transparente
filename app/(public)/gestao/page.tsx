export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarMoeda } from "@/lib/utils";
import PropostaForm from "@/components/public/PropostaForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestão",
  description: "Acompanhe as obras e melhorias do condomínio e envie suas propostas.",
};

const statusLabel: Record<string, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const statusClass: Record<string, string> = {
  PLANEJADO: "bg-blue-100 text-blue-700",
  EM_ANDAMENTO: "bg-warning-light text-yellow-700",
  CONCLUIDO: "bg-success-light text-green-700",
  CANCELADO: "bg-muted text-muted-foreground",
};

function progressoColor(p: number) {
  if (p <= 33) return "bg-red-500";
  if (p <= 66) return "bg-yellow-500";
  return "bg-green-500";
}

export default async function GestaoPage() {
  const obras = await prisma.obra.findMany({
    where: { publicado: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Obras */}
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Obras e Melhorias</h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe os projetos e obras em andamento no condomínio.
          </p>
        </div>

        {obras.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">Nenhuma obra publicada no momento.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {obras.map((obra) => (
              <div key={obra.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-base leading-snug">{obra.titulo}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusClass[obra.status]}`}>
                    {statusLabel[obra.status]}
                  </span>
                </div>

                {obra.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {obra.descricao}
                  </p>
                )}

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span>{obra.progresso}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden" aria-label={`Progresso: ${obra.progresso}%`}>
                    <div
                      className={`h-full rounded-full transition-all ${progressoColor(obra.progresso)}`}
                      style={{ width: `${obra.progresso}%` }}
                    />
                  </div>
                </div>

                {(obra.orcamento || obra.gasto) && (
                  <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                    {obra.orcamento && (
                      <div>
                        Orçamento:{" "}
                        <span className="text-foreground font-medium">
                          {formatarMoeda(Number(obra.orcamento))}
                        </span>
                      </div>
                    )}
                    {obra.gasto && (
                      <div>
                        Gasto:{" "}
                        <span className="text-foreground font-medium">
                          {formatarMoeda(Number(obra.gasto))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Propostas */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Enviar Proposta</h2>
          <p className="text-muted-foreground">
            Tem uma sugestão ou ideia para melhorar o condomínio? Envie sua proposta — ela será analisada pela gestão.
          </p>
        </div>

        <div className="card">
          <PropostaForm />
        </div>
      </section>
    </div>
  );
}
