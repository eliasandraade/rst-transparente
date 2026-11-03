import { describe, expect, it } from "vitest";
import { redirectTo } from "./redirect";

describe("redirecionamento", () => {
  it("Location relativo, sem host (o do proxy seria o interno)", () => {
    const res = redirectTo("/condominio-a/admin/login?orken=desligado");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/condominio-a/admin/login?orken=desligado");
  });

  it("só caminho do próprio site", () => {
    expect(() => redirectTo("https://outro.test/")).toThrow();
    expect(() => redirectTo("//outro.test/")).toThrow();
  });
});
