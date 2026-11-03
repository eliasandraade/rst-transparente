import type { UnitLayout } from "@/lib/units";

/** Bloco e unidade: listas da planta do condomínio, ou campo livre quando não há planta. */
export default function UnidadeCampos({ layout }: { layout: UnitLayout | null }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="bloco" className="label">Bloco <span className="text-[var(--danger)]">*</span></label>
        {layout ? (
          <select id="bloco" name="bloco" required className="select">
            <option value="">Selecionar</option>
            {layout.blocos.map((b) => <option key={b} value={b}>Bloco {b}</option>)}
          </select>
        ) : (
          <input id="bloco" name="bloco" required maxLength={10} className="input uppercase" autoComplete="off" />
        )}
      </div>
      <div>
        <label htmlFor="unidade" className="label">Unidade <span className="text-[var(--danger)]">*</span></label>
        {layout ? (
          <select id="unidade" name="unidade" required className="select">
            <option value="">Selecionar</option>
            {layout.unidades.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        ) : (
          <input id="unidade" name="unidade" required maxLength={10} className="input uppercase" autoComplete="off" />
        )}
      </div>
    </div>
  );
}
