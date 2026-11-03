import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Testes de integração: PostgreSQL e Redis de verdade (no CI, serviços do GitHub
 * Actions), com o esquema aplicado por `prisma migrate deploy`. Exigem
 * DATABASE_URL de um banco DESCARTÁVEL: a suíte grava e apaga dados.
 */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
