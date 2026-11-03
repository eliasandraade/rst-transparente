import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Testes de unidade: sem banco nem Redis (o rate limit cai na memória fora de produção). */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["lib/**/*.test.ts", "app/**/*.test.ts", "components/**/*.test.ts"],
    environment: "node",
    env: { NODE_ENV: "test" },
  },
});
