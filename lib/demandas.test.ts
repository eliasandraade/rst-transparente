import { describe, expect, it } from "vitest";
import { DUMMY_ACCESS_CODE_HASH, generateCode, generateProtocol, hashAccessCode, verifyAccessCode } from "./demandas";

describe("protocolo e código de acesso", () => {
  it("protocolo não sequencial, sem caracteres ambíguos", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const protocol = generateProtocol("RST", 2026);
      expect(protocol).toMatch(/^RST-2026-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      seen.add(protocol);
    }
    expect(seen.size).toBe(200);
  });

  it("código guardado como hash; confere mesmo digitado em minúsculas", async () => {
    const code = generateCode(6);
    const hash = await hashAccessCode(code);
    expect(hash).not.toContain(code);
    expect(await verifyAccessCode(code.toLowerCase(), hash)).toBe(true);
    expect(await verifyAccessCode("ZZZZZZ", hash)).toBe(code === "ZZZZZZ");
  });

  it("o hash fictício nunca confere (custo igual na consulta de protocolo inexistente)", async () => {
    expect(await verifyAccessCode(generateCode(6), DUMMY_ACCESS_CODE_HASH)).toBe(false);
  });
});
