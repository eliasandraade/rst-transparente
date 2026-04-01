export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart2 } from "lucide-react";
import EnqueteForm from "@/components/admin/EnqueteForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarEnquetePage({ params }: PageProps) {
  const { id } = await params;

  const enquete = await prisma.enquete.findUnique({
    where: { id },
    include: {
      opcoes: {
        orderBy: { ordem: "asc" },
        include: { votos: true },
      },
    },
  });

  if (!enquete) notFound();

  const totalVotos = enquete.opcoes.reduce((acc, o) => acc + o.votos.length, 0);

  const opcoes = enquete.opcoes.map((o) => ({
    id: o.id,
    texto: o.texto,
    ordem: o.ordem,
    totalVotos: o.votos.length,
  }));

  const initialData = {
    pergunta: enquete.pergunta,
    tipo: enquete.tipo,
    status: enquete.status,
    dataFim: enquete.dataFim ? enquete.dataFim.toISOString().slice(0, 16) : "",
    opcoes: enquete.opcoes.map((o) => o.texto),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Enquete</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">{enquete.pergunta}</p>
        </div>
      </div>

      <div className="card mb-6">
        <EnqueteForm enqueteId={id} initialData={initialData} />
      </div>

      {/* Resultados */}
      {totalVotos > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Resultados ({totalVotos} {totalVotos === 1 ? "voto" : "votos"})
          </h2>
          <div className="space-y-3">
            {opcoes.map((opcao) => {
              const pct = totalVotos > 0 ? Math.round((opcao.totalVotos / totalVotos) * 100) : 0;
              return (
                <div key={opcao.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{opcao.texto}</span>
                    <span className="text-muted-foreground">
                      {opcao.totalVotos} {opcao.totalVotos === 1 ? "voto" : "votos"} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
