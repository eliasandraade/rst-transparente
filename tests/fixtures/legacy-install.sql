-- Instalação anterior às organizações (esquema 0_init), com dados SINTÉTICOS no
-- formato dos reais: o CI aplica as migrations seguintes por cima e confere que
-- cada linha passou a ser da organização do RST, sem perda.
INSERT INTO users (id, email, name, password, role, ativo, "createdAt", "updatedAt") VALUES
  ('legacy-u1', 'master@legacy.test', 'Master', 'x', 'MASTER', true, now(), now()),
  ('legacy-u2', 'gestao@legacy.test', 'Gestão', 'x', 'GESTAO', true, now(), now());
INSERT INTO config_portal (id, "nomeCondominio", "periodoAtivo", "updatedAt") VALUES
  ('config-principal', 'Condomínio Residencial Santíssima Trindade', '2026-06', now());
INSERT INTO categorias (id, nome, tipo) VALUES ('legacy-c1', 'Taxa de Condomínio', 'RECEITA');
INSERT INTO lancamentos (id, tipo, "categoriaId", descricao, valor, data, periodo, status, "createdAt", "updatedAt") VALUES
  ('legacy-l1', 'RECEITA', 'legacy-c1', 'Taxa', 1234.56, '2026-06-10', '2026-06', 'PUBLICADO', now(), now());
INSERT INTO demands (id, protocol, "accessCode", "requesterName", unit, phone, category, title, description, "createdAt", "updatedAt") VALUES
  ('legacy-d1', 'RST-2026-K7M9Q2', 'x', 'Pessoa', 'A-101', '85999990000', 'MANUTENCAO', 'Lâmpada', 'Lâmpada queimada no corredor.', '2026-05-01', now());
INSERT INTO demand_updates (id, "demandId", "newStatus", message, "createdAt") VALUES
  ('legacy-du1', 'legacy-d1', 'RECEBIDA', 'Demanda registrada.', '2026-05-01');
INSERT INTO enquetes (id, pergunta, status, "createdAt", "updatedAt") VALUES ('legacy-e1', 'Pintura?', 'PUBLICADO', now(), now());
INSERT INTO opcoes_enquete (id, "enqueteId", texto) VALUES ('legacy-o1', 'legacy-e1', 'Sim');
INSERT INTO votos_enquete (id, "enqueteId", "opcaoId", ip, "createdAt") VALUES ('legacy-v1', 'legacy-e1', 'legacy-o1', '192.0.2.1', now());
INSERT INTO processos (id, "numeroProcesso", tribunal, "createdAt", "updatedAt") VALUES ('legacy-p1', '00000010020268060001', 'TJCE', now(), now());
