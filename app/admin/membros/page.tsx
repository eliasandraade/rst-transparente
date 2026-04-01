export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembroForm from "@/components/admin/MembroForm";
import DeleteMembroButton from "@/components/admin/DeleteMembroButton";
import { UserCircle } from "lucide-react";
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

        {membros.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum membro cadastrado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {membros.map((m) => (
              <div key={m.id} className="flex items-center gap-4 py-4">
                {m.fotoUrl ? (
                  <img
                    src={m.fotoUrl}
                    alt={m.nome}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{m.nome}</p>
                  <p className="text-sm text-primary font-medium">{m.cargo}</p>
                  {m.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{m.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {m.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <span className="text-xs text-muted-foreground">#{m.ordem}</span>
                  <DeleteMembroButton id={m.id} nome={m.nome} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
