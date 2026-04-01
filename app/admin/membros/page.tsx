export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembroForm from "@/components/admin/MembroForm";
import MembroListaAdmin from "@/components/admin/MembroListaAdmin";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quem Somos — Membros" };

export default async function MembrosPage() {
  await auth();
  const membros = await prisma.membro.findMany({ orderBy: { ordem: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quem Somos — Membros</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os membros exibidos na página pública &quot;Quem Somos&quot;.
          </p>
        </div>
      </div>

      {/* Formulário de cadastro */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Adicionar membro</h2>
        <MembroForm />
      </div>

      {/* Lista de membros */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Membros cadastrados ({membros.length})
        </h2>

        <MembroListaAdmin membros={membros} />
      </div>
    </div>
  );
}
