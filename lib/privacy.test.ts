import { describe, expect, it } from "vitest";
import { errorSummary, pseudonymizeIp } from "./privacy";

describe("pseudônimo de IP", () => {
  it("estável na organização, diferente entre organizações, sem o IP em claro", () => {
    const a1 = pseudonymizeIp("org-a", "203.0.113.7");
    expect(a1).toBe(pseudonymizeIp("org-a", "203.0.113.7"));
    expect(a1).not.toBe(pseudonymizeIp("org-b", "203.0.113.7"));
    expect(a1.startsWith("h1:")).toBe(true);
    expect(a1).not.toContain("203.0.113.7");
    expect(pseudonymizeIp("org-a", "unknown")).toBe("unknown");
  });
});

describe("resumo de erro para log", () => {
  it("tipo e código, nunca a mensagem", () => {
    const error = Object.assign(new Error("Invalid value for argument `phone`: 85999990000"), { name: "PrismaClientValidationError", code: "P2009" });
    expect(errorSummary(error)).toBe("PrismaClientValidationError P2009");
    expect(errorSummary("texto qualquer")).toBe("erro");
  });
});
