/**
 * Planta do condomínio (organizations.unitLayout): blocos e unidades que multas e
 * notificações aceitam. Sem planta cadastrada, só o formato do código é conferido.
 */
export interface UnitLayout {
  blocos: string[];
  unidades: string[];
}

const CODE = /^[A-Z0-9-]{1,10}$/;

function codes(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.every((item) => typeof item === "string" && CODE.test(item)) ? (value as string[]) : null;
}

export function parseUnitLayout(value: unknown): UnitLayout | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const blocos = codes((value as Record<string, unknown>).blocos);
  const unidades = codes((value as Record<string, unknown>).unidades);
  return blocos && unidades ? { blocos, unidades } : null;
}

export function validarBloco(layout: UnitLayout | null, bloco: string): boolean {
  const value = bloco.trim().toUpperCase();
  return layout ? layout.blocos.includes(value) : CODE.test(value);
}

export function validarUnidade(layout: UnitLayout | null, unidade: string): boolean {
  const value = unidade.trim().toUpperCase();
  return layout ? layout.unidades.includes(value) : CODE.test(value);
}
