export const dynamic = "force-dynamic";

import ObraForm from "@/components/admin/ObraForm";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Nova Obra" };

export default function NovaObraPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/obras"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para obras
        </Link>
        <h1 className="text-2xl font-bold">Nova Obra</h1>
        <p className="text-muted-foreground">Cadastre um novo projeto ou obra do condomínio</p>
      </div>

      <div className="card">
        <ObraForm />
      </div>
    </div>
  );
}
