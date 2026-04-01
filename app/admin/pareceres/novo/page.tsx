import ParecerForm from "@/components/admin/ParecerForm";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Novo Parecer" };

export default function NovoParecerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pareceres"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para pareceres
        </Link>
        <h1 className="text-2xl font-bold">Novo Parecer</h1>
        <p className="text-muted-foreground">
          Cadastre um novo parecer do Conselho Fiscal
        </p>
      </div>

      <div className="card">
        <ParecerForm />
      </div>
    </div>
  );
}
