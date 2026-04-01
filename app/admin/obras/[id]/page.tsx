export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ObraForm from "@/components/admin/ObraForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Editar Obra" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarObraPage({ params }: Props) {
  const { id } = await params;

  const obra = await prisma.obra.findUnique({ where: { id } });
  if (!obra) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/obras"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para obras
        </Link>
        <h1 className="text-2xl font-bold">Editar Obra</h1>
        <p className="text-muted-foreground">{obra.titulo}</p>
      </div>

      <div className="card">
        <ObraForm
          initialData={{
            id: obra.id,
            titulo: obra.titulo,
            descricao: obra.descricao ?? "",
            orcamento: obra.orcamento ? String(Number(obra.orcamento)) : "",
            gasto: obra.gasto ? String(Number(obra.gasto)) : "",
            status: obra.status,
            progresso: obra.progresso,
            dataInicio: obra.dataInicio
              ? obra.dataInicio.toISOString().split("T")[0]
              : "",
            dataPrevista: obra.dataPrevista
              ? obra.dataPrevista.toISOString().split("T")[0]
              : "",
            imagemUrl: obra.imagemUrl ?? "",
            publicado: obra.publicado,
          }}
        />
      </div>
    </div>
  );
}
