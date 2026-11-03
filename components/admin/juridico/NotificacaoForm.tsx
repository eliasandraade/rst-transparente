"use client";

import { useState } from "react";
import { useOrgRouter as useRouter } from "@/lib/org-navigation";
import { orgFetch } from "@/lib/org-navigation";
import Link from "@/lib/org-navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import UnidadeCampos from "@/components/admin/juridico/UnidadeCampos";
import type { UnitLayout } from "@/lib/units";

const STATUS_OPTIONS = [
  { value: "EMITIDA", label: "Emitida" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "RESPONDIDA", label: "Respondida" },
  { value: "CONTESTADA", label: "Contestada" },
  { value: "ARQUIVADA", label: "Arquivada" },
];

interface Props {
  /** Planta do condomínio (lib/units.ts); sem ela, bloco e unidade são campos livres. */
  layout?: UnitLayout | null;
  processos?: Array<{ id: string; numeroProcesso: string; classe: string | null }>;
  notificacaoId?: string;
  defaultValues?: {
    status?: string;
    dataEntrega?: string | null;
    dataResposta?: string | null;
    descricaoInterna?: string | null;
    anexoUrl?: string | null;
    anexoNome?: string | null;
  };
  modo: "criar" | "editar";
}

export default function NotificacaoForm({ layout = null, processos = [], notificacaoId, defaultValues, modo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const body =
      modo === "criar"
        ? {
            processoId: fd.get("processoId") || null,
            bloco: fd.get("bloco") as string,
            unidade: fd.get("unidade") as string,
            motivo: fd.get("motivo") as string,
            descricaoInterna: (fd.get("descricaoInterna") as string) || null,
            dataEmissao: fd.get("dataEmissao") as string,
            anexoUrl: (fd.get("anexoUrl") as string) || null,
            anexoNome: (fd.get("anexoNome") as string) || null,
          }
        : {
            status: fd.get("status") as string,
            dataEntrega: (fd.get("dataEntrega") as string) || null,
            dataResposta: (fd.get("dataResposta") as string) || null,
            descricaoInterna: (fd.get("descricaoInterna") as string) || null,
            observacao: (fd.get("observacao") as string) || undefined,
          };

    try {
      const url =
        modo === "criar"
          ? "/api/juridico/notificacoes"
          : `/api/juridico/notificacoes/${notificacaoId}`;
      const method = modo === "criar" ? "POST" : "PATCH";

      const res = await orgFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setErro(json.error ?? "Erro ao salvar.");
        return;
      }

      router.push(`/admin/juridico/notificacoes/${json.id}`);
      router.refresh();
    } catch {
      setErro("Falha na conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div className="flex items-start gap-2.5 bg-[var(--danger-subtle)] border border-border rounded-xl px-4 py-3" role="alert">
          <AlertTriangle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[var(--danger)]">{erro}</p>
        </div>
      )}

      {modo === "criar" && (
        <>
          <div>
            <label htmlFor="processoId" className="label">Processo vinculado (opcional)</label>
            <select id="processoId" name="processoId" className="select">
              <option value="">Sem vínculo com processo</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numeroProcesso}{p.classe ? ` — ${p.classe}` : ""}
                </option>
              ))}
            </select>
          </div>

          <UnidadeCampos layout={layout} />

          <div>
            <label htmlFor="motivo" className="label">Motivo <span className="text-[var(--danger)]">*</span></label>
            <input id="motivo" name="motivo" required maxLength={200} className="input" placeholder="Ex: Perturbação do sossego" />
          </div>

          <div>
            <label htmlFor="dataEmissao" className="label">Data de emissão <span className="text-[var(--danger)]">*</span></label>
            <input id="dataEmissao" name="dataEmissao" type="date" required className="input" />
          </div>

          <div>
            <label htmlFor="descricaoInterna" className="label">Descrição interna</label>
            <textarea id="descricaoInterna" name="descricaoInterna" rows={3} maxLength={2000} className="textarea" placeholder="Detalhes internos (nunca público)..." />
          </div>

          <div>
            <label htmlFor="anexoUrl" className="label">Link para foto/vídeo</label>
            <input id="anexoUrl" name="anexoUrl" type="url" className="input" placeholder="https://..." />
          </div>
        </>
      )}

      {modo === "editar" && (
        <>
          <div>
            <label htmlFor="status" className="label">Status <span className="text-[var(--danger)]">*</span></label>
            <select id="status" name="status" required defaultValue={defaultValues?.status} className="select">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataEntrega" className="label">Data de entrega</label>
              <input id="dataEntrega" name="dataEntrega" type="date" defaultValue={defaultValues?.dataEntrega ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="dataResposta" className="label">Data de resposta</label>
              <input id="dataResposta" name="dataResposta" type="date" defaultValue={defaultValues?.dataResposta ?? ""} className="input" />
            </div>
          </div>

          <div>
            <label htmlFor="descricaoInterna" className="label">Descrição interna</label>
            <textarea id="descricaoInterna" name="descricaoInterna" rows={3} maxLength={2000} className="textarea" defaultValue={defaultValues?.descricaoInterna ?? ""} />
          </div>

          <div>
            <label htmlFor="observacao" className="label">Motivo da alteração</label>
            <input id="observacao" name="observacao" maxLength={500} className="input" placeholder="Opcional — registrado na auditoria" />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Salvando...</> : modo === "criar" ? "Criar notificação" : "Salvar alterações"}
        </button>
        <Link href="/admin/juridico/notificacoes" className="btn btn-secondary" style={{ minHeight: "auto" }}>Cancelar</Link>
      </div>
    </form>
  );
}
