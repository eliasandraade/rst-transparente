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
    <div className="animate-page-enter max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          href="/demandas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-foreground transition-colors duration-150 mb-5"
          style={{ minHeight: "auto" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Central de Demandas
        </Link>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)] flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Consulta
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Acompanhar Demanda
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1.5 leading-relaxed">
          Informe o protocolo e o código de acesso recebidos ao abrir a
          demanda.
        </p>
      </div>

      <div className="card">
        <AcompanharDemandaForm defaultProtocol={protocol ?? ""} />
      </div>
    </div>
  );
}
