"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DemandaDetalhePublico, { type DemandaPublicData } from "@/components/public/DemandaDetalhePublico";
import Link from "next/link";

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
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">
          Sessão expirada ou protocolo não encontrado.
        </p>
        <Link
          href="/demandas/acompanhar"
          className="inline-flex items-center justify-center bg-primary text-white rounded-xl px-6 py-3 font-bold hover:bg-primary/90 transition-colors"
        >
          Consultar novamente
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-muted-foreground">
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
