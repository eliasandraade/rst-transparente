import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetMemoryRateLimits } from "./rate-limit";

const rule = { name: "teste", limit: 2, windowSeconds: 60 };

describe("rate limit (memória, fora de produção e sem Redis)", () => {
  beforeEach(() => resetMemoryRateLimits());

  it("deixa passar até o limite e recusa depois, por sujeito", async () => {
    expect(await rateLimit(rule, "a", 0)).toEqual({ allowed: true });
    expect(await rateLimit(rule, "a", 1)).toEqual({ allowed: true });
    expect(await rateLimit(rule, "a", 2)).toEqual({ allowed: false, reason: "limited" });
    expect(await rateLimit(rule, "b", 2)).toEqual({ allowed: true });
  });

  it("a janela recomeça", async () => {
    await rateLimit(rule, "a", 0);
    await rateLimit(rule, "a", 1);
    expect(await rateLimit(rule, "a", 61_000)).toEqual({ allowed: true });
  });
});
