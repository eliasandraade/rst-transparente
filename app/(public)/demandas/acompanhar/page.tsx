import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AcompanharDemandaForm from "@/components/public/AcompanharDemandaForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acompanhar Demanda — Central de Demandas",
};

interface Props {
  searchParams: Promise<{ protocol?: string }>;
}

export default async function AcompanharPage({ searchParams }: Props) {
  const { protocol } = await searchParams;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          href="/demandas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold">Acompanhar Demanda</h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Informe o protocolo e o código de acesso que você recebeu ao abrir
          a demanda.
        </p>
      </div>

      <AcompanharDemandaForm defaultProtocol={protocol ?? ""} />
    </div>
  );
}
