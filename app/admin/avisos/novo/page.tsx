export const dynamic = "force-dynamic";

import AvisoForm from "@/components/admin/AvisoForm";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Novo Aviso" };

export default function NovoAvisoPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/avisos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para avisos
        </Link>
        <h1 className="text-2xl font-bold">Novo Aviso</h1>
        <p className="text-muted-foreground">Crie um novo aviso ou informativo para os moradores</p>
      </div>

      <div className="card">
        <AvisoForm />
      </div>
    </div>
  );
}
