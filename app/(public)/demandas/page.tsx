import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Demandas",
  description:
    "Abra uma solicitação formal ou acompanhe o andamento de uma demanda no Condomínio Residencial Santíssima Trindade.",
};

export default function DemandasHubPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3">Central de Demandas</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Registre uma solicitação ou acompanhe o andamento de uma demanda
          junto à gestão do condomínio.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/demandas/nova"
          className="flex items-center gap-4 w-full bg-primary text-white rounded-xl px-6 py-5 font-bold text-lg hover:bg-primary/90 transition-colors"
          style={{ minHeight: "72px" }}
        >
          <ClipboardList className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <div className="text-left">
            <div>Abrir Nova Demanda</div>
            <div className="text-sm font-normal text-white/80 mt-0.5">
              Manutenção, reclamação, sugestão e mais
            </div>
          </div>
        </Link>

        <Link
          href="/demandas/acompanhar"
          className="flex items-center gap-4 w-full bg-white border-2 border-primary text-primary rounded-xl px-6 py-5 font-bold text-lg hover:bg-primary/5 transition-colors"
          style={{ minHeight: "72px" }}
        >
          <Search className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <div className="text-left">
            <div>Acompanhar Demanda</div>
            <div className="text-sm font-normal text-muted-foreground mt-0.5">
              Consulte pelo protocolo e código de acesso
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800 leading-relaxed">
        <strong>ℹ️ Como funciona?</strong>
        <p className="mt-2">
          Ao abrir uma demanda, você receberá um <strong>número de protocolo</strong> e
          um <strong>código de acesso</strong>. Guarde essas informações para
          acompanhar o andamento da sua solicitação.
        </p>
      </div>
    </div>
  );
}
