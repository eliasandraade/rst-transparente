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
    <div className="animate-page-enter max-w-2xl mx-auto px-4 sm:px-6 py-8">
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
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-foreground transition-colors duration-150 mb-5"
              style={{ minHeight: "auto" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Central de Demandas
            </Link>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Nova Demanda
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Abrir Demanda
            </h1>
            <p className="text-xs text-[var(--foreground-muted)] mt-1.5 leading-relaxed">
              Campos marcados com{" "}
              <span className="text-[var(--danger)]" aria-hidden="true">*</span>{" "}
              são obrigatórios.
            </p>
          </div>

          <div className="card">
            <NovaDemandaForm onSuccess={setSuccess} />
          </div>
        </>
      )}
    </div>
  );
}
