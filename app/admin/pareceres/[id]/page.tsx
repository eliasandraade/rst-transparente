export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ParecerForm from "@/components/admin/ParecerForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Editar Parecer" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarParecerPage({ params }: Props) {
  const { id } = await params;
  const parecer = await prisma.parecer.findUnique({ where: { id } });

  if (!parecer) notFound();

  const initialData = {
    id: parecer.id,
    periodoRef: parecer.periodoRef,
    titulo: parecer.titulo,
    texto: parecer.texto ?? "",
    dataEmissao: parecer.dataEmissao.toISOString().split("T")[0],
    membrosConselho: parecer.membrosConselho ?? "",
    arquivoUrl: parecer.arquivoUrl,
    arquivoNome: parecer.arquivoNome,
    status: parecer.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pareceres"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para pareceres
        </Link>
        <h1 className="text-2xl font-bold">Editar Parecer</h1>
        <p className="text-muted-foreground">{parecer.titulo}</p>
      </div>

      <div className="card">
        <ParecerForm initialData={initialData} />
      </div>
    </div>
  );
}
