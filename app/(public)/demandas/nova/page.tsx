"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NovaDemandaForm from "@/components/public/NovaDemandaForm";
import DemandaSuccessView from "@/components/public/DemandaSuccessView";

interface SuccessData {
  protocol: string;
  accessCode: string;
}

export default function NovaDemandaPage() {
  const [success, setSuccess] = useState<SuccessData | null>(null);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {success ? (
        <DemandaSuccessView
          protocol={success.protocol}
          accessCode={success.accessCode}
        />
      ) : (
        <>
          <div className="mb-6">
            <Link
              href="/demandas"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold">Abrir Nova Demanda</h1>
            <p className="text-muted-foreground mt-1">
              Campos marcados com <span className="text-red-500">*</span> são obrigatórios.
            </p>
          </div>

          <NovaDemandaForm onSuccess={setSuccess} />
        </>
      )}
    </div>
  );
}
