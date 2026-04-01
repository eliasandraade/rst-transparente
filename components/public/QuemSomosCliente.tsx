"use client";

import { useState } from "react";
import { UserCircle, X } from "lucide-react";

interface Membro {
  id: string;
  nome: string;
  cargo: string;
  descricao: string | null;
  fotoUrl: string | null;
}

interface Props {
  membros: Membro[];
}

function ModalPerfil({ membro, onClose }: { membro: Membro; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors min-h-[auto]"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {membro.fotoUrl ? (
            <img
              src={membro.fotoUrl}
              alt={membro.nome}
              className="w-28 h-28 rounded-full object-cover border-4 border-primary/10"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/10">
              <UserCircle className="w-16 h-16 text-primary/40" />
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-foreground">{membro.nome}</h2>
            <p className="text-primary font-semibold mt-1">{membro.cargo}</p>
          </div>

          {membro.descricao && (
            <p className="text-muted-foreground leading-relaxed text-sm">
              {membro.descricao}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuemSomosCliente({ membros }: Props) {
  const [selecionado, setSelecionado] = useState<Membro | null>(null);

  if (membros.length === 0) {
    return (
      <div className="card text-center py-16">
        <p className="text-muted-foreground">Nenhum membro cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {membros.map((membro) => (
          <button
            key={membro.id}
            onClick={() => setSelecionado(membro)}
            className="card flex flex-col items-center text-center gap-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer text-left w-full min-h-[auto]"
          >
            {membro.fotoUrl ? (
              <img
                src={membro.fotoUrl}
                alt={membro.nome}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/10">
                <UserCircle className="w-14 h-14 text-primary/40" />
              </div>
            )}
            <div>
              <p className="font-bold text-foreground text-lg leading-tight">{membro.nome}</p>
              <p className="text-sm font-semibold text-primary mt-0.5">{membro.cargo}</p>
              {membro.descricao && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                  {membro.descricao}
                </p>
              )}
              <p className="text-xs text-primary/60 mt-3 font-medium">Ver perfil →</p>
            </div>
          </button>
        ))}
      </div>

      {selecionado && (
        <ModalPerfil membro={selecionado} onClose={() => setSelecionado(null)} />
      )}
    </>
  );
}
