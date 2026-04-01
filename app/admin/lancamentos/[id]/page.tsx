import { prisma } from "@/lib/prisma";
import LancamentoForm from "@/components/admin/LancamentoForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Editar Lançamento" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarLancamentoPage({ params }: Props) {
  const { id } = await params;

  const [lancamento, categorias] = await Promise.all([
    prisma.lancamento.findUnique({ where: { id } }),
    prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: [{ tipo: "asc" }, { ordem: "asc" }, { nome: "asc" }],
    }),
  ]);

  if (!lancamento) notFound();

  const initialData = {
    id: lancamento.id,
    tipo: lancamento.tipo,
    categoriaId: lancamento.categoriaId,
    descricao: lancamento.descricao,
    valor: Number(lancamento.valor).toFixed(2),
    data: lancamento.data.toISOString().split("T")[0],
    fornecedor: lancamento.fornecedor ?? "",
    observacoes: lancamento.observacoes ?? "",
    periodo: lancamento.periodo,
    status: lancamento.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/lancamentos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para lançamentos
        </Link>
        <h1 className="text-2xl font-bold">Editar Lançamento</h1>
        <p className="text-muted-foreground">{lancamento.descricao}</p>
      </div>

      <div className="card">
        <LancamentoForm categorias={categorias} initialData={initialData} />
      </div>
    </div>
  );
}
