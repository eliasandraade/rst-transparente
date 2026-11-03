import { afterEach, describe, expect, it } from "vitest";
import { clientIp } from "./client-ip";

const request = (headers: Record<string, string>) => new Request("https://cond.test/", { headers });

describe("IP do cliente", () => {
  afterEach(() => {
    delete process.env.CLIENT_IP_HEADER;
  });

  it("lê o cabeçalho confiável do edge (x-real-ip por padrão)", () => {
    expect(clientIp(request({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("nunca usa o X-Forwarded-For que o cliente escreve", () => {
    expect(clientIp(request({ "x-forwarded-for": "1.2.3.4" }))).toBe("unknown");
    expect(clientIp(request({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
  });

  it("valor malformado vira unknown", () => {
    expect(clientIp(request({ "x-real-ip": "<script>" }))).toBe("unknown");
  });

  it("cabeçalho configurável", () => {
    process.env.CLIENT_IP_HEADER = "cf-connecting-ip";
    expect(clientIp(request({ "cf-connecting-ip": "2001:db8::1", "x-real-ip": "203.0.113.7" }))).toBe("2001:db8::1");
  });
});
