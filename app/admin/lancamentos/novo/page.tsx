export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import LancamentoForm from "@/components/admin/LancamentoForm";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Novo Lançamento" };

export default async function NovoLancamentoPage() {
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    orderBy: [{ tipo: "asc" }, { ordem: "asc" }, { nome: "asc" }],
  });

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
        <h1 className="text-2xl font-bold">Novo Lançamento</h1>
        <p className="text-muted-foreground">
          Cadastre uma receita ou despesa do condomínio
        </p>
      </div>

      <div className="card">
        <LancamentoForm categorias={categorias} />
      </div>
    </div>
  );
}
