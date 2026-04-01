export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import PropostaRespostaForm from "@/components/admin/PropostaRespostaForm";

export const metadata: Metadata = { title: "Detalhe da Proposta" };

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  ANALISANDO: "Analisando",
  RESPONDIDA: "Respondida",
  ARQUIVADA: "Arquivada",
};

const statusClass: Record<string, string> = {
  PENDENTE: "bg-warning-light text-yellow-700",
  ANALISANDO: "bg-blue-100 text-blue-700",
  RESPONDIDA: "bg-success-light text-green-700",
  ARQUIVADA: "bg-muted text-muted-foreground",
};

export default async function PropostaDetailPage({ params }: Props) {
  const { id } = await params;

  const proposta = await prisma.proposta.findUnique({ where: { id } });
  if (!proposta) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/propostas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para propostas
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Proposta</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[proposta.status]}`}>
            {statusLabel[proposta.status]}
          </span>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Recebida em</p>
            <p className="font-medium">{formatarData(proposta.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Nome</p>
            <p className="font-medium">{proposta.nome ?? <span className="italic text-muted-foreground">Anônimo</span>}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Unidade</p>
            <p className="font-medium">{proposta.unidade ?? <span className="text-muted-foreground">—</span>}</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Proposta</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{proposta.texto}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Atualizar status e resposta</h2>
        <PropostaRespostaForm
          id={proposta.id}
          statusAtual={proposta.status}
          respostaAtual={proposta.resposta ?? ""}
        />
      </div>
    </div>
  );
}
