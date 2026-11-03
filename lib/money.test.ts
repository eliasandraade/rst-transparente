import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { moneySchema, parseMoney, roundSpreadsheetMoney, sumMoney } from "./money";

describe("dinheiro em decimal exato", () => {
  it("aceita texto pt-BR, texto com ponto e número com até 2 casas", () => {
    expect(parseMoney("1.234,56")?.toString()).toBe("1234.56");
    expect(parseMoney("1234,5")?.toString()).toBe("1234.5");
    expect(parseMoney("1234.56")?.toString()).toBe("1234.56");
    expect(parseMoney(1234.56)?.toString()).toBe("1234.56");
    expect(parseMoney("0")?.toString()).toBe("0");
  });

  it("recusa mais de 2 casas, negativos, notação científica e lixo (sem arredondar escondido)", () => {
    for (const input of [0.1 + 0.2, "10,555", "-5", 1e21, "abc", "", null, undefined, Number.NaN, "1,234,56"]) {
      expect(parseMoney(input)).toBeNull();
    }
  });

  it("soma sem erro binário: 0,1 + 0,2 = 0,3", () => {
    expect(sumMoney([new Prisma.Decimal("0.1"), new Prisma.Decimal("0.2")]).toString()).toBe("0.3");
    expect(sumMoney(["336276.96", null, "0.04"]).toString()).toBe("336277");
  });

  it("planilha: célula calculada arredonda meio-para-cima em centavos, como o numeric(12,2)", () => {
    expect(roundSpreadsheetMoney(1234.5600000000002)?.toString()).toBe("1234.56");
    expect(roundSpreadsheetMoney(10.005)?.toString()).toBe("10.01");
    expect(roundSpreadsheetMoney(-1)).toBeNull();
  });

  it("schema: positivo obrigatório quando pedido", () => {
    expect(moneySchema({ positive: true }).safeParse("0").success).toBe(false);
    const parsed = moneySchema({ positive: true }).safeParse("99,90");
    expect(parsed.success && parsed.data.toString()).toBe("99.9");
  });
});
