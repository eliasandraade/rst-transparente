-- Organizações do Orken COND (docs/orken-cond/arquitetura.md), etapa expand.
--
-- Cada condomínio é uma organização; todo registro de domínio passa a ter
-- organizationId. Aditivo: tabela nova, colunas anuláveis preenchidas, índices e
-- políticas de RLS. Nenhuma linha apagada, nenhum valor alterado além do novo
-- organizationId. O código anterior roda com este esquema (ignora as colunas).
--
-- A organização do RST só nasce numa instalação que já tem dados (a instalação de
-- um condomínio só, que sempre foi o RST); banco novo começa sem organização.

CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "platformOrganizationId" UUID,
    "protocolPrefix" TEXT NOT NULL,
    "datajudTribunal" TEXT NOT NULL DEFAULT 'TJCE',
    "accentColor" TEXT,
    "unitLayout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- O nome vem da configuração real do portal; nada inventado. Tribunal e planta
-- (blocos A–I, unidades 101–408) são os que o código validava até aqui.
INSERT INTO "organizations" ("id", "slug", "name", "shortName", "protocolPrefix", "datajudTribunal", "unitLayout", "updatedAt")
SELECT '8f282e77-cb75-4d75-99fd-9ac01057227c', 'santissima-trindade',
       COALESCE(NULLIF(TRIM((SELECT "nomeCondominio" FROM "config_portal" ORDER BY "updatedAt" DESC LIMIT 1)), ''),
                'Condomínio Residencial Santíssima Trindade'),
       'Santíssima Trindade', 'RST', 'TJCE',
       '{"blocos":["A","B","C","D","E","F","G","H","I"],"unidades":["101","102","103","104","105","106","107","108","201","202","203","204","205","206","207","208","301","302","303","304","305","306","307","308","401","402","403","404","405","406","407","408"]}'::jsonb,
       CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "users") OR EXISTS (SELECT 1 FROM "categorias") OR EXISTS (SELECT 1 FROM "lancamentos") OR EXISTS (SELECT 1 FROM "pareceres") OR EXISTS (SELECT 1 FROM "planilhas_download") OR EXISTS (SELECT 1 FROM "avisos") OR EXISTS (SELECT 1 FROM "obras") OR EXISTS (SELECT 1 FROM "propostas") OR EXISTS (SELECT 1 FROM "enquetes") OR EXISTS (SELECT 1 FROM "opcoes_enquete") OR EXISTS (SELECT 1 FROM "votos_enquete") OR EXISTS (SELECT 1 FROM "membros") OR EXISTS (SELECT 1 FROM "config_portal") OR EXISTS (SELECT 1 FROM "demands") OR EXISTS (SELECT 1 FROM "demand_updates") OR EXISTS (SELECT 1 FROM "processos") OR EXISTS (SELECT 1 FROM "notificacoes") OR EXISTS (SELECT 1 FROM "multas") OR EXISTS (SELECT 1 FROM "juridico_auditoria");

-- O nome padrão deixa de ser o de um condomínio específico (linhas existentes ficam como estão).
ALTER TABLE "config_portal" ALTER COLUMN "nomeCondominio" SET DEFAULT '';

-- ── organizationId em toda tabela de domínio ──────────────────────────────
ALTER TABLE "users" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "categorias" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "lancamentos" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "pareceres" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "planilhas_download" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "avisos" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "obras" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "propostas" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "enquetes" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "opcoes_enquete" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "votos_enquete" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "membros" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "config_portal" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "demands" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "demand_updates" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "processos" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "notificacoes" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "multas" ADD COLUMN     "organizationId" UUID;
ALTER TABLE "juridico_auditoria" ADD COLUMN     "organizationId" UUID;

-- Tudo o que existe é do RST (a única organização que esta instalação já teve).
UPDATE "users" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "categorias" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "lancamentos" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "pareceres" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "planilhas_download" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "avisos" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "obras" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "propostas" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "enquetes" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "opcoes_enquete" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "votos_enquete" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "membros" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "config_portal" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "demands" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "demand_updates" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "processos" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "notificacoes" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "multas" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');
UPDATE "juridico_auditoria" SET "organizationId" = '8f282e77-cb75-4d75-99fd-9ac01057227c' WHERE "organizationId" IS NULL AND EXISTS (SELECT 1 FROM "organizations" WHERE "id" = '8f282e77-cb75-4d75-99fd-9ac01057227c');

-- ── Unicidades por organização (antes globais) ───────────────────────────
DROP INDEX "users_email_key";
DROP INDEX "demands_protocol_key";
DROP INDEX "processos_numeroProcesso_key";

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organizations_platformOrganizationId_key" ON "organizations"("platformOrganizationId");
CREATE UNIQUE INDEX "organizations_protocolPrefix_key" ON "organizations"("protocolPrefix");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE UNIQUE INDEX "users_organizationId_email_key" ON "users"("organizationId", "email");
CREATE INDEX "categorias_organizationId_idx" ON "categorias"("organizationId");
CREATE INDEX "lancamentos_organizationId_idx" ON "lancamentos"("organizationId");
CREATE INDEX "pareceres_organizationId_idx" ON "pareceres"("organizationId");
CREATE INDEX "planilhas_download_organizationId_idx" ON "planilhas_download"("organizationId");
CREATE INDEX "avisos_organizationId_idx" ON "avisos"("organizationId");
CREATE INDEX "obras_organizationId_idx" ON "obras"("organizationId");
CREATE INDEX "propostas_organizationId_idx" ON "propostas"("organizationId");
CREATE INDEX "enquetes_organizationId_idx" ON "enquetes"("organizationId");
CREATE INDEX "opcoes_enquete_organizationId_idx" ON "opcoes_enquete"("organizationId");
CREATE INDEX "votos_enquete_organizationId_idx" ON "votos_enquete"("organizationId");
CREATE INDEX "membros_organizationId_idx" ON "membros"("organizationId");
CREATE UNIQUE INDEX "config_portal_organizationId_key" ON "config_portal"("organizationId");
CREATE INDEX "demands_organizationId_idx" ON "demands"("organizationId");
CREATE UNIQUE INDEX "demands_organizationId_protocol_key" ON "demands"("organizationId", "protocol");
CREATE INDEX "demand_updates_organizationId_idx" ON "demand_updates"("organizationId");
CREATE INDEX "processos_organizationId_idx" ON "processos"("organizationId");
CREATE UNIQUE INDEX "processos_organizationId_numeroProcesso_key" ON "processos"("organizationId", "numeroProcesso");
CREATE INDEX "notificacoes_organizationId_idx" ON "notificacoes"("organizationId");
CREATE INDEX "multas_organizationId_idx" ON "multas"("organizationId");
CREATE INDEX "juridico_auditoria_organizationId_idx" ON "juridico_auditoria"("organizationId");

ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pareceres" ADD CONSTRAINT "pareceres_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "planilhas_download" ADD CONSTRAINT "planilhas_download_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "obras" ADD CONSTRAINT "obras_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enquetes" ADD CONSTRAINT "enquetes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "opcoes_enquete" ADD CONSTRAINT "opcoes_enquete_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votos_enquete" ADD CONSTRAINT "votos_enquete_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "membros" ADD CONSTRAINT "membros_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "config_portal" ADD CONSTRAINT "config_portal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demands" ADD CONSTRAINT "demands_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demand_updates" ADD CONSTRAINT "demand_updates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "processos" ADD CONSTRAINT "processos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "multas" ADD CONSTRAINT "multas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "juridico_auditoria" ADD CONSTRAINT "juridico_auditoria_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- Cada consulta do app roda numa transação com app.organization_id definido
-- (lib/tenant.ts). Sem ele, nenhuma linha aparece nem é gravada. Vale para o papel
-- de runtime do app (sem BYPASSRLS, não dono das tabelas); quem roda migrations é
-- o dono/superusuário, que não é afetado.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
CREATE POLICY "users_organization_isolation" ON "users"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "categorias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categorias" FORCE ROW LEVEL SECURITY;
CREATE POLICY "categorias_organization_isolation" ON "categorias"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "lancamentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lancamentos" FORCE ROW LEVEL SECURITY;
CREATE POLICY "lancamentos_organization_isolation" ON "lancamentos"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "pareceres" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pareceres" FORCE ROW LEVEL SECURITY;
CREATE POLICY "pareceres_organization_isolation" ON "pareceres"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "planilhas_download" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planilhas_download" FORCE ROW LEVEL SECURITY;
CREATE POLICY "planilhas_download_organization_isolation" ON "planilhas_download"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "avisos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "avisos" FORCE ROW LEVEL SECURITY;
CREATE POLICY "avisos_organization_isolation" ON "avisos"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "obras" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "obras" FORCE ROW LEVEL SECURITY;
CREATE POLICY "obras_organization_isolation" ON "obras"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "propostas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "propostas" FORCE ROW LEVEL SECURITY;
CREATE POLICY "propostas_organization_isolation" ON "propostas"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "enquetes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enquetes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "enquetes_organization_isolation" ON "enquetes"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "opcoes_enquete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opcoes_enquete" FORCE ROW LEVEL SECURITY;
CREATE POLICY "opcoes_enquete_organization_isolation" ON "opcoes_enquete"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "votos_enquete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "votos_enquete" FORCE ROW LEVEL SECURITY;
CREATE POLICY "votos_enquete_organization_isolation" ON "votos_enquete"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "membros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membros" FORCE ROW LEVEL SECURITY;
CREATE POLICY "membros_organization_isolation" ON "membros"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "config_portal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "config_portal" FORCE ROW LEVEL SECURITY;
CREATE POLICY "config_portal_organization_isolation" ON "config_portal"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "demands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demands" FORCE ROW LEVEL SECURITY;
CREATE POLICY "demands_organization_isolation" ON "demands"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "demand_updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demand_updates" FORCE ROW LEVEL SECURITY;
CREATE POLICY "demand_updates_organization_isolation" ON "demand_updates"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "processos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "processos" FORCE ROW LEVEL SECURITY;
CREATE POLICY "processos_organization_isolation" ON "processos"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "notificacoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notificacoes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notificacoes_organization_isolation" ON "notificacoes"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "multas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multas" FORCE ROW LEVEL SECURITY;
CREATE POLICY "multas_organization_isolation" ON "multas"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
ALTER TABLE "juridico_auditoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "juridico_auditoria" FORCE ROW LEVEL SECURITY;
CREATE POLICY "juridico_auditoria_organization_isolation" ON "juridico_auditoria"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
