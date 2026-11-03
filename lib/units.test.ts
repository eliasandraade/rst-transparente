import { describe, expect, it } from "vitest";
import { parseUnitLayout, validarBloco, validarUnidade } from "./units";

describe("planta do condomínio", () => {
  const layout = parseUnitLayout({ blocos: ["A", "B"], unidades: ["101", "102"] });

  it("com planta, só blocos e unidades dela", () => {
    expect(validarBloco(layout, "a")).toBe(true);
    expect(validarBloco(layout, "C")).toBe(false);
    expect(validarUnidade(layout, "102")).toBe(true);
    expect(validarUnidade(layout, "103")).toBe(false);
  });

  it("sem planta, só o formato", () => {
    expect(validarBloco(null, "Torre-2")).toBe(true);
    expect(validarUnidade(null, "1203")).toBe(true);
    expect(validarUnidade(null, "12 03")).toBe(false);
    expect(validarUnidade(null, "")).toBe(false);
  });

  it("planta malformada vale como ausente", () => {
    expect(parseUnitLayout({ blocos: [], unidades: ["101"] })).toBeNull();
    expect(parseUnitLayout({ blocos: ["A"], unidades: [101] })).toBeNull();
    expect(parseUnitLayout("A,B")).toBeNull();
  });
});
