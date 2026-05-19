import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import NovoProcessoForm from "@/components/admin/juridico/NovoProcessoForm";

export const metadata: Metadata = {
  title: "Novo Processo | Jurídico | Admin",
};

export default async function NovoProcessoPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="animate-page-enter">
      <div className="border-b border-border bg-surface px-6 py-5">
        <Link
          href="/admin/juridico/processos"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-foreground mb-3 transition-colors"
          style={{ minHeight: "auto" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Processos
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Cadastrar processo</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Informe o número CNJ — o sistema buscará os detalhes no DataJud/TJCE automaticamente.
        </p>
      </div>

      <div className="px-6 py-6 max-w-xl">
        <NovoProcessoForm />
      </div>
    </div>
  );
}
