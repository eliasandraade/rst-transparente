export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarPeriodo } from "@/lib/utils";
import ParecerCard from "@/components/public/ParecerCard";
import type { ParecerPublico } from "@/types";
import type { Metadata } from "next";
import { FileCheck, FileX } from "lucide-react";

export const metadata: Metadata = {
  title: "Parecer do Conselho Fiscal",
  description:
    "Leia e baixe o parecer oficial do Conselho Fiscal do Condomínio Residencial Santíssima Trindade.",
};

async function getPareceres(): Promise<ParecerPublico[]> {
  const pareceres = await prisma.parecer.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { periodoRef: "desc" },
  });

  return pareceres.map((p) => ({
    id: p.id,
    periodoRef: p.periodoRef,
    titulo: p.titulo,
    texto: p.texto,
    arquivoUrl: p.arquivoUrl,
    arquivoNome: p.arquivoNome,
    dataEmissao: p.dataEmissao.toISOString(),
    membrosConselho: p.membrosConselho,
  }));
}

export default async function ParecerPage() {
  const pareceres = await getPareceres();
  const [parecerAtual, ...historico] = pareceres;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="w-8 h-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Parecer do Conselho Fiscal</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Documentos oficiais emitidos pelo Conselho Fiscal do condomínio.
        </p>
      </div>

      {pareceres.length === 0 ? (
        <div className="card text-center py-16">
          <FileX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            Nenhum parecer publicado ainda.
          </p>
          <p className="text-sm text-muted-foreground">
            Os pareceres do Conselho Fiscal serão publicados aqui quando
            disponíveis.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Parecer atual em destaque */}
          {parecerAtual && (
            <section aria-label="Parecer mais recente">
              <ParecerCard parecer={parecerAtual} destaque />
            </section>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <section aria-label="Histórico de pareceres">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Pareceres Anteriores
                <span className="text-sm font-normal text-muted-foreground">
                  ({historico.length})
                </span>
              </h2>

              {/* Lista resumida */}
              <div className="card">
                <ul className="divide-y divide-border" role="list">
                  {historico.map((p) => (
                    <li
                      key={p.id}
                      className="py-4 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div>
                        <p className="font-medium">{p.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatarPeriodo(p.periodoRef)}
                        </p>
                      </div>
                      {p.arquivoUrl && (
                        <a
                          href={p.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={p.arquivoNome ?? "parecer.pdf"}
                          className="btn-secondary text-sm flex-shrink-0"
                          aria-label={`Baixar parecer de ${formatarPeriodo(p.periodoRef)}`}
                        >
                          Baixar PDF
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Informação institucional */}
      <div className="mt-10 text-sm text-muted-foreground text-center border border-border rounded-lg p-4 bg-white">
        <p>
          O Conselho Fiscal é responsável pela análise das contas do condomínio
          e pela emissão de pareceres nos termos da convenção condominial.
        </p>
      </div>
    </div>
  );
}
