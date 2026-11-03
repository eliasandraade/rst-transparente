-- Sessões da equipe no servidor e entrada pelo Orken ID (docs/orken-cond/identidade.md).
--
-- Aditiva: tabelas novas e duas colunas anuláveis em users. Nenhuma linha existente
-- muda. Sessões e auditoria são da organização, com RLS como as demais tabelas de
-- domínio; o estado do feed da Platform é do produto (uma instalação), sem RLS.

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('PASSWORD', 'ORKEN_ID');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "orkenLinkedAt" TIMESTAMP(3),
ADD COLUMN     "orkenSubject" UUID;

-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfHash" TEXT NOT NULL,
    "authMethod" "AuthMethod" NOT NULL,
    "idToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_audit_events" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "subject" UUID,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_access_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessVersion" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_access_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_event_cursors" (
    "consumer" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_event_cursors_pkey" PRIMARY KEY ("consumer")
);

-- CreateTable
CREATE TABLE "platform_event_receipts" (
    "eventId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_event_receipts_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_sessions_tokenHash_key" ON "staff_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "staff_sessions_organizationId_idx" ON "staff_sessions"("organizationId");

-- CreateIndex
CREATE INDEX "staff_sessions_userId_idx" ON "staff_sessions"("userId");

-- CreateIndex
CREATE INDEX "staff_audit_events_organizationId_createdAt_idx" ON "staff_audit_events"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_event_receipts_receivedAt_idx" ON "platform_event_receipts"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_organizationId_orkenSubject_key" ON "users"("organizationId", "orkenSubject");

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_audit_events" ADD CONSTRAINT "staff_audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Uma linha só, criada aqui: o consumidor do feed só faz UPDATE.
INSERT INTO "platform_access_state" ("id", "accessVersion", "updatedAt") VALUES (1, 0, CURRENT_TIMESTAMP);

-- ── RLS nas tabelas novas da organização ─────────────────────────────────
ALTER TABLE "staff_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_sessions" FORCE ROW LEVEL SECURITY;
CREATE POLICY "staff_sessions_organization_isolation" ON "staff_sessions"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);

ALTER TABLE "staff_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_audit_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "staff_audit_events_organization_isolation" ON "staff_audit_events"
  USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
