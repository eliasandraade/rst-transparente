import { describe, expect, it } from "vitest";
import { orkenConfig } from "./config";

const FULL = {
  ORKEN_ISSUER: "https://account.orken.com.br/",
  ORKEN_CLIENT_ID: "orken-cond-web",
  ORKEN_CLIENT_SECRET: "x",
  PLATFORM_API_URL: "https://api.orken.com.br",
  ORKEN_SERVICE_CLIENT_ID: "orken-cond-service",
  ORKEN_SERVICE_CLIENT_SECRET: "y",
  APP_BASE_URL: "https://cond.orken.com.br",
} as const;

const env = (values: Record<string, string>) => ({ NODE_ENV: "production", ...values }) as unknown as NodeJS.ProcessEnv;

describe("configuração do Orken ID", () => {
  it("nenhuma variável: desligado", () => {
    expect(orkenConfig(env({}))).toBeNull();
  });

  it("todas: origens normalizadas, feed ligado por padrão", () => {
    expect(orkenConfig(env(FULL))).toMatchObject({
      issuer: "https://account.orken.com.br",
      appBaseUrl: "https://cond.orken.com.br",
      eventsSync: true,
    });
  });

  it("pela metade: erro com o nome do que falta, sem valores", () => {
    const partial: Record<string, string> = { ...FULL };
    delete partial.ORKEN_CLIENT_SECRET;
    expect(() => orkenConfig(env(partial))).toThrow(/ORKEN_CLIENT_SECRET/);
    expect(() => orkenConfig(env(partial))).not.toThrow(/orken-cond-web/);
  });

  it("emissor sem HTTPS é recusado em produção", () => {
    expect(() => orkenConfig(env({ ...FULL, ORKEN_ISSUER: "http://account.orken.com.br" }))).toThrow(/HTTPS/);
  });
});
