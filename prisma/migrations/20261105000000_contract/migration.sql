-- Contract do isolamento (docs/orken-cond/arquitetura.md, seção 2).
--
-- O banco passa a garantir sozinho o que o backend já fazia:
--  1. todo registro de domínio tem organização (CHECK, validado agora: as linhas
--     existentes já foram atribuídas na migration 20261103000000_organizations);
--  2. nenhum registro aponta para registro de outra organização (gatilho por
--     referência; vale para quem escreve direto no banco, inclusive o dono).
-- Nenhuma linha muda. Se alguma linha existente violar, a migration para antes de
-- criar qualquer coisa (o deploy não sobe e a versão anterior segue no ar).

-- ── Conferência das linhas existentes ────────────────────────────────────
DO $$
DECLARE
  bad bigint;
BEGIN
  SELECT count(*) INTO bad FROM "users" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'users: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "categorias" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'categorias: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "lancamentos" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'lancamentos: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "pareceres" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'pareceres: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "planilhas_download" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'planilhas_download: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "avisos" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'avisos: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "obras" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'obras: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "propostas" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'propostas: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "enquetes" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'enquetes: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "opcoes_enquete" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'opcoes_enquete: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "votos_enquete" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'votos_enquete: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "membros" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'membros: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "config_portal" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'config_portal: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "demands" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'demands: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "demand_updates" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'demand_updates: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "processos" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'processos: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "notificacoes" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'notificacoes: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "multas" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'multas: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "juridico_auditoria" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'juridico_auditoria: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "staff_sessions" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'staff_sessions: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "staff_audit_events" WHERE "organizationId" IS NULL;
  IF bad > 0 THEN RAISE EXCEPTION 'staff_audit_events: % linha(s) sem organização', bad; END IF;
  SELECT count(*) INTO bad FROM "lancamentos" x JOIN "categorias" r ON r."id" = x."categoriaId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'lancamentos.categoriaId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "opcoes_enquete" x JOIN "enquetes" r ON r."id" = x."enqueteId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'opcoes_enquete.enqueteId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "votos_enquete" x JOIN "enquetes" r ON r."id" = x."enqueteId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'votos_enquete.enqueteId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "votos_enquete" x JOIN "opcoes_enquete" r ON r."id" = x."opcaoId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'votos_enquete.opcaoId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "demand_updates" x JOIN "demands" r ON r."id" = x."demandId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'demand_updates.demandId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "demand_updates" x JOIN "users" r ON r."id" = x."createdById" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'demand_updates.createdById: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "notificacoes" x JOIN "processos" r ON r."id" = x."processoId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'notificacoes.processoId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "notificacoes" x JOIN "users" r ON r."id" = x."criadoPorId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'notificacoes.criadoPorId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "multas" x JOIN "processos" r ON r."id" = x."processoId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'multas.processoId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "multas" x JOIN "users" r ON r."id" = x."criadoPorId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'multas.criadoPorId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "juridico_auditoria" x JOIN "users" r ON r."id" = x."usuarioId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'juridico_auditoria.usuarioId: % referência(s) de outra organização', bad; END IF;
  SELECT count(*) INTO bad FROM "staff_sessions" x JOIN "users" r ON r."id" = x."userId" WHERE r."organizationId" IS DISTINCT FROM x."organizationId";
  IF bad > 0 THEN RAISE EXCEPTION 'staff_sessions.userId: % referência(s) de outra organização', bad; END IF;
END
$$;

-- ── Organização obrigatória ──────────────────────────────────────────────
ALTER TABLE "users" ADD CONSTRAINT "users_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "pareceres" ADD CONSTRAINT "pareceres_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "planilhas_download" ADD CONSTRAINT "planilhas_download_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "obras" ADD CONSTRAINT "obras_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "enquetes" ADD CONSTRAINT "enquetes_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "opcoes_enquete" ADD CONSTRAINT "opcoes_enquete_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "votos_enquete" ADD CONSTRAINT "votos_enquete_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "membros" ADD CONSTRAINT "membros_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "config_portal" ADD CONSTRAINT "config_portal_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "demands" ADD CONSTRAINT "demands_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "demand_updates" ADD CONSTRAINT "demand_updates_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "processos" ADD CONSTRAINT "processos_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "multas" ADD CONSTRAINT "multas_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "juridico_auditoria" ADD CONSTRAINT "juridico_auditoria_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_organization_required" CHECK ("organizationId" IS NOT NULL);
ALTER TABLE "staff_audit_events" ADD CONSTRAINT "staff_audit_events_organization_required" CHECK ("organizationId" IS NOT NULL);

-- ── Referência só dentro da mesma organização ────────────────────────────
-- Roda com os privilégios de quem escreve: pelo papel de runtime, o RLS já limita a
-- busca à organização da transação; pelo dono, o filtro explícito faz o mesmo.
CREATE FUNCTION "cond_same_organization"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  referenced_table text := TG_ARGV[0];
  reference_column text := TG_ARGV[1];
  reference text := to_jsonb(NEW) ->> reference_column;
  found boolean;
BEGIN
  IF reference IS NULL THEN
    RETURN NEW;
  END IF;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE "id" = $1 AND "organizationId" = $2)', referenced_table)
    INTO found USING reference, NEW."organizationId";
  IF NOT found THEN
    RAISE EXCEPTION 'referência fora da organização: %.% -> %', TG_TABLE_NAME, reference_column, referenced_table
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER "lancamentos_categoriaId_same_organization" BEFORE INSERT OR UPDATE OF "categoriaId", "organizationId" ON "lancamentos"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('categorias', 'categoriaId');
CREATE TRIGGER "opcoes_enquete_enqueteId_same_organization" BEFORE INSERT OR UPDATE OF "enqueteId", "organizationId" ON "opcoes_enquete"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('enquetes', 'enqueteId');
CREATE TRIGGER "votos_enquete_enqueteId_same_organization" BEFORE INSERT OR UPDATE OF "enqueteId", "organizationId" ON "votos_enquete"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('enquetes', 'enqueteId');
CREATE TRIGGER "votos_enquete_opcaoId_same_organization" BEFORE INSERT OR UPDATE OF "opcaoId", "organizationId" ON "votos_enquete"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('opcoes_enquete', 'opcaoId');
CREATE TRIGGER "demand_updates_demandId_same_organization" BEFORE INSERT OR UPDATE OF "demandId", "organizationId" ON "demand_updates"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('demands', 'demandId');
CREATE TRIGGER "demand_updates_createdById_same_organization" BEFORE INSERT OR UPDATE OF "createdById", "organizationId" ON "demand_updates"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('users', 'createdById');
CREATE TRIGGER "notificacoes_processoId_same_organization" BEFORE INSERT OR UPDATE OF "processoId", "organizationId" ON "notificacoes"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('processos', 'processoId');
CREATE TRIGGER "notificacoes_criadoPorId_same_organization" BEFORE INSERT OR UPDATE OF "criadoPorId", "organizationId" ON "notificacoes"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('users', 'criadoPorId');
CREATE TRIGGER "multas_processoId_same_organization" BEFORE INSERT OR UPDATE OF "processoId", "organizationId" ON "multas"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('processos', 'processoId');
CREATE TRIGGER "multas_criadoPorId_same_organization" BEFORE INSERT OR UPDATE OF "criadoPorId", "organizationId" ON "multas"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('users', 'criadoPorId');
CREATE TRIGGER "juridico_auditoria_usuarioId_same_organization" BEFORE INSERT OR UPDATE OF "usuarioId", "organizationId" ON "juridico_auditoria"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('users', 'usuarioId');
CREATE TRIGGER "staff_sessions_userId_same_organization" BEFORE INSERT OR UPDATE OF "userId", "organizationId" ON "staff_sessions"
  FOR EACH ROW EXECUTE FUNCTION "cond_same_organization"('users', 'userId');
