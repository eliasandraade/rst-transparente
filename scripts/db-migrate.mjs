/**
 * Migrations no start do serviço (.railway/railway.ts).
 *
 * O banco de produção nasceu com `prisma db push`, sem histórico de migrations. Na
 * primeira vez (há tabelas, não há `_prisma_migrations`), a migration 0_init é
 * marcada como aplicada SÓ se o esquema real for idêntico ao do repositório
 * (`prisma migrate diff --exit-code`); qualquer diferença aborta o start, e o
 * Railway mantém a versão anterior no ar. Depois disso, `prisma migrate deploy`.
 *
 * Migrations rodam com o dono das tabelas: MIGRATION_DATABASE_URL quando o app
 * conecta pelo papel de runtime (cond_app, sem privilégio de criar tabela nem de
 * mexer no histórico); sem ela, DATABASE_URL.
 */
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const ownerUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
const prisma = (args) =>
  execFileSync("npx", ["prisma", ...args], { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, DATABASE_URL: ownerUrl } });

async function needsBaseline() {
  const db = new PrismaClient({ datasources: { db: { url: ownerUrl } } });
  try {
    const [row] = await db.$queryRaw`SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS migrations, to_regclass('public.users') IS NOT NULL AS users`;
    return !row.migrations && row.users;
  } finally {
    await db.$disconnect();
  }
}

if (await needsBaseline()) {
  console.log("[db-migrate] banco sem histórico de migrations: conferindo o esquema antes de marcar 0_init");
  try {
    // Sem banco de sombra em produção: compara com o schema.prisma, que na versão
    // que faz o baseline é exatamente a 0_init (o CI garante schema × migrations).
    // Numa versão posterior, o schema já tem mudanças, a comparação falha e nada é
    // marcado: o baseline nunca acontece fora da versão certa.
    prisma(["migrate", "diff", "--from-url", ownerUrl, "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"]);
  } catch {
    console.error("[db-migrate] o esquema do banco difere das migrations; nada foi marcado");
    process.exit(1);
  }
  prisma(["migrate", "resolve", "--applied", "0_init"]);
}
prisma(["migrate", "deploy"]);
