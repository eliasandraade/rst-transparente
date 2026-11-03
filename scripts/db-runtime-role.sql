-- Papel de runtime do Orken COND (docs/orken-cond/arquitetura.md, seção 2).
--
-- O app conecta com este papel: não é superusuário, não tem BYPASSRLS e não é dono
-- das tabelas, então as políticas de RLS (migration 20261103000000_organizations)
-- valem para ele. Migrations seguem com o dono das tabelas. A senha é definida à
-- parte por quem opera o banco (ALTER ROLE cond_app PASSWORD ...), nunca aqui.
-- Idempotente. Roda com o dono das tabelas (o mesmo das migrations).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cond_app') THEN
    CREATE ROLE cond_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

ALTER ROLE cond_app NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;

DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO cond_app', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO cond_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cond_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cond_app;
-- Tabelas criadas depois por quem roda este script (o dono, nas migrations) já nascem liberadas.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cond_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cond_app;
-- Histórico de migrations é do dono do esquema.
REVOKE ALL ON "_prisma_migrations" FROM cond_app;
