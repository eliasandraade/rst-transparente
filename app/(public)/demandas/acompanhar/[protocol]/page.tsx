"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DemandaDetalhePublico, { type DemandaPublicData } from "@/components/public/DemandaDetalhePublico";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function DemandaDetalhePublicoPage() {
  const { protocol } = useParams<{ protocol: string }>();
  const [data, setData] = useState<DemandaPublicData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const key = `demand-${decodeURIComponent(protocol)}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        setData(JSON.parse(stored) as DemandaPublicData);
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [protocol]);

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-[var(--foreground-muted)] text-sm mb-5">
          Sessão expirada ou protocolo não encontrado.
        </p>
        <Link
          href="/demandas/acompanhar"
          className="btn btn-primary"
        >
          Consultar novamente
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-2 text-[var(--foreground-subtle)] text-sm">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Carregando...
      </div>
    );
  }

  return (
    <DemandaDetalhePublico
      data={data}
      protocol={decodeURIComponent(protocol)}
    />
  );
}
