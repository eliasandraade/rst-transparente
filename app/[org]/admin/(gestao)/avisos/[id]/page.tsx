export const dynamic = "force-dynamic";

import { tenantDb } from "@/lib/tenant";
import AvisoForm from "@/components/admin/AvisoForm";
import Link from "@/lib/org-navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/staff";

export const metadata: Metadata = { title: "Editar Aviso" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarAvisoPage({ params }: Props) {
  await requireStaff();
  const db = await tenantDb();
  const { id } = await params;

  const aviso = await db.aviso.findUnique({ where: { id } });
  if (!aviso) notFound();

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
        <h1 className="text-2xl font-bold">Editar Aviso</h1>
        <p className="text-muted-foreground">{aviso.titulo}</p>
      </div>

      <div className="card">
        <AvisoForm
          initialData={{
            id: aviso.id,
            titulo: aviso.titulo,
            corpo: aviso.corpo,
            fixado: aviso.fixado,
            status: aviso.status,
          }}
        />
      </div>
    </div>
  );
}
