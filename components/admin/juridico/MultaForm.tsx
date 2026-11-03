"use client";

import { useState } from "react";
import { useOrgRouter as useRouter } from "@/lib/org-navigation";
import { orgFetch } from "@/lib/org-navigation";
import Link from "@/lib/org-navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import UnidadeCampos from "@/components/admin/juridico/UnidadeCampos";
import type { UnitLayout } from "@/lib/units";

const STATUS_OPTIONS = [
  { value: "APLICADA", label: "Aplicada" },
  { value: "NOTIFICADA", label: "Notificada" },
  { value: "CONTESTADA", label: "Contestada" },
  { value: "MANTIDA", label: "Mantida" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "PAGA", label: "Paga" },
  { value: "VENCIDA", label: "Vencida" },
];

interface Props {
  /** Planta do condomínio (lib/units.ts); sem ela, bloco e unidade são campos livres. */
  layout?: UnitLayout | null;
  processos?: Array<{ id: string; numeroProcesso: string; classe: string | null }>;
  multaId?: string;
  defaultValues?: {
    status?: string;
    valor?: number;
    dataVencimento?: string | null;
    dataPagamento?: string | null;
    descricaoInterna?: string | null;
  };
  modo: "criar" | "editar";
}

export default function MultaForm({ layout = null, processos = [], multaId, defaultValues, modo }: Props) {
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
            valor: parseFloat(fd.get("valor") as string),
            dataAplicacao: fd.get("dataAplicacao") as string,
            dataVencimento: (fd.get("dataVencimento") as string) || null,
            anexoUrl: (fd.get("anexoUrl") as string) || null,
          }
        : {
            status: fd.get("status") as string,
            valor: fd.get("valor") ? parseFloat(fd.get("valor") as string) : undefined,
            dataVencimento: (fd.get("dataVencimento") as string) || null,
            dataPagamento: (fd.get("dataPagamento") as string) || null,
            descricaoInterna: (fd.get("descricaoInterna") as string) || null,
            observacao: (fd.get("observacao") as string) || undefined,
          };

    try {
      const url = modo === "criar" ? "/api/juridico/multas" : `/api/juridico/multas/${multaId}`;
      const method = modo === "criar" ? "POST" : "PATCH";

      const res = await orgFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) { setErro(json.error ?? "Erro ao salvar."); return; }

      router.push(`/admin/juridico/multas/${json.id}`);
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
            <input id="motivo" name="motivo" required maxLength={200} className="input" placeholder="Ex: Barulho excessivo — Art. 10 da Convenção" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="valor" className="label">Valor (R$) <span className="text-[var(--danger)]">*</span></label>
              <input id="valor" name="valor" type="number" step="0.01" min="0.01" required className="input tabular-nums" placeholder="0,00" />
            </div>
            <div>
              <label htmlFor="dataAplicacao" className="label">Data de aplicação <span className="text-[var(--danger)]">*</span></label>
              <input id="dataAplicacao" name="dataAplicacao" type="date" required className="input" />
            </div>
          </div>

          <div>
            <label htmlFor="dataVencimento" className="label">Data de vencimento</label>
            <input id="dataVencimento" name="dataVencimento" type="date" className="input" />
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

          <div>
            <label htmlFor="valor" className="label">Valor (R$)</label>
            <input id="valor" name="valor" type="number" step="0.01" min="0.01" defaultValue={defaultValues?.valor} className="input tabular-nums" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataVencimento" className="label">Vencimento</label>
              <input id="dataVencimento" name="dataVencimento" type="date" defaultValue={defaultValues?.dataVencimento ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="dataPagamento" className="label">Data de pagamento</label>
              <input id="dataPagamento" name="dataPagamento" type="date" defaultValue={defaultValues?.dataPagamento ?? ""} className="input" />
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
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Salvando...</> : modo === "criar" ? "Aplicar multa" : "Salvar alterações"}
        </button>
        <Link href="/admin/juridico/multas" className="btn btn-secondary" style={{ minHeight: "auto" }}>Cancelar</Link>
      </div>
    </form>
  );
}
