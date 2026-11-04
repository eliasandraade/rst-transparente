import { defineRailway, github, project, service } from "railway/iac";

// Orken COND on Railway (.railway/README.md). This repository manages only its own service, the app, in each
// environment (`partial` below): Postgres, Redis and their volumes are not in this file and apply never touches them.
// Variables are unmanaged: secrets live in Railway, never here. Same settings as the old railway.toml.
export const partial = "rst-transparente";

export default defineRailway((ctx) => {
  const production = ctx.isEnvironment("production");
  if (!production && !ctx.isEnvironment("staging")) throw new Error("Only the staging and production environments are defined here");

  const rstTransparente = service("rst-transparente", {
    // Both environments deploy main, as before.
    source: github("eliasandraade/rst-transparente", { branch: "main", checkSuites: false }),
    build: { builder: "RAILPACK", buildCommand: "npx prisma generate && npm run build" },
    // The schema only changes by versioned migration: scripts/db-migrate.mjs runs `prisma migrate deploy` as the owner
    // (MIGRATION_DATABASE_URL) before the app starts as cond_app. Never db push.
    start: "node scripts/db-migrate.mjs && npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 60,
    // Restart ON_FAILURE is Railway's default and is stored as null; declaring it would show a diff on every plan.
    deploy: { sleepApplication: true, restartPolicyMaxRetries: 3 },
    replicas: { "europe-west4-drams3a": 1 },
    // Custom domains exist only in production; staging keeps its Railway domain.
    ...(production ? { domains: ["cond.orken.com.br", "www.transparenciarst.com.br"] } : {}),
  });

  return project("rst-transparente", {
    variables: { managed: false },
    resources: [rstTransparente],
  });
});
