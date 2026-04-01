export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatarPeriodo, gerarPeriodos } from "@/lib/utils";
import { FileDown, Calendar } from "lucide-react";
import UploadPlanilhaForm from "@/components/admin/UploadPlanilhaForm";
import DeletePlanilhaButton from "@/components/admin/DeletePlanilhaButton";

export default async function PlanilhasPage() {
  const planilhas = await prisma.planilhaDownload.findMany({
    orderBy: { periodo: "desc" },
  });

  const periodos = gerarPeriodos(24);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <FileDown className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planilhas para Download</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as planilhas financeiras disponíveis para download
          </p>
        </div>
      </div>

      {/* Upload form */}
      <div className="card mb-8">
        <h2 className="text-base font-semibold text-foreground mb-4">Nova Planilha</h2>
        <UploadPlanilhaForm periodos={periodos} />
      </div>

      {/* List */}
      <div className="card">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Planilhas publicadas ({planilhas.length})
        </h2>

        {planilhas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma planilha publicada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Período
                    </span>
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Nome do arquivo
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Data upload
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {planilhas.map((planilha) => (
                  <tr key={planilha.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-foreground">
                      {formatarPeriodo(planilha.periodo)}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      <a
                        href={planilha.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline transition-colors flex items-center gap-1"
                      >
                        <FileDown className="w-3.5 h-3.5 flex-shrink-0" />
                        {planilha.arquivoNome}
                      </a>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {new Date(planilha.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <DeletePlanilhaButton id={planilha.id} nome={planilha.arquivoNome} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
