# Orken COND — inventário e arquitetura

O RST Transparente vira o **Orken COND**, produto de gestão, transparência e relacionamento condominial da Andrade
Systems, integrado à Orken Platform, ao Orken ID e à Minha Orken. O Condomínio Residencial Santíssima Trindade (RST)
passa a ser a primeira organização cliente, não a identidade do produto.

## 1. Estado anterior (inventário de 03/11/2026)

- Next.js 15 (App Router), React 19, Prisma 5 + PostgreSQL 18, NextAuth v5 (Credentials, sessão JWT), Tailwind,
  Recharts, Cloudinary, `xlsx` 0.18.5. Cerca de 16 mil linhas, 42 rotas de API, cerca de 60 páginas, 143 chamadas ao
  Prisma, 3 transações, nenhum SQL cru.
- Railway: projeto `rst-transparente`, só produção, serviços `Postgres` e `rst-transparente`; domínio
  `www.transparenciarst.com.br`. Sem Redis, sem staging. O app conecta como superusuário do banco.
- Esquema mantido com `prisma db push`: não havia migrations versionadas. Sem testes; só `next lint`.
- PR #2 (rascunho, não integrado) preparava ida para VPS/Dokploy; não faz parte desta missão.

### Módulos

| Módulo | Implementado | Produção (registros) | Problemas | Ação |
|---|---|---|---|---|
| Financeiro (lançamentos, categorias, métricas, gráficos) | sim | 12 categorias, 67 lançamentos publicados (03–06/2026) | escrita liberada a qualquer papel; `Decimal(12,2)` correto no banco | preservar; isolar por organização; autorização central |
| Pareceres do Conselho Fiscal | sim | 1 | PDF público no Cloudinary | preservar; arquivos por organização |
| Planilhas para download | sim | 0 | — | preservar |
| Importação de planilha | sim | — | `xlsx` 0.18.5 com vulnerabilidades conhecidas | preservar; atualizar a biblioteca |
| Avisos | sim | 3 | — | preservar |
| Obras | sim | 1 | — | preservar |
| Propostas | sim | 1 | criação pública sem limite de taxa | preservar; rate limit |
| Enquetes | sim | 1 enquete, 2 opções, 1 voto | voto aceita opção de outra enquete; IP vindo de cabeçalho forjável; IP guardado em claro | preservar; validar opção; IP confiável e guardado como hash por organização |
| Quem somos (membros) | sim | 6 (fotos em `i.ibb.co`) | — | preservar |
| Central de Demandas | sim | 61 demandas, 91 movimentações, protocolos `RST-ano-código` | consulta responde 404/401 (revela protocolo existente); rate limit em memória e por IP forjável; criação sem limite; anexos em URL pública | preservar protocolos e códigos; corrigir enumeração; Redis; anexos privados |
| Jurídico (processos, notificações, multas, auditoria) | sim | 2 processos (DataJud TJCE), 4 auditorias, 0 notificações, 0 multas | `numeroProcesso` único global; sincronização só manual | preservar; único por organização; tribunal por organização |
| Configuração do portal | sim | 1 linha (nome, CNPJ, endereço) | linha única global | uma por organização |
| Usuários (MASTER, SINDICO, GESTAO, CONSELHO) | sim | 6 (1 MASTER, 1 SINDICO, 4 GESTAO) | JWT com papel embutido por 30 dias: desativação e troca de papel não valem até expirar; e-mail único global | sessões no servidor, revogáveis; e-mail único por organização |

### Problemas de segurança encontrados

- `prisma/seed.ts` cria um MASTER com senha padrão conhecida e imprime as credenciais; `SEED_ADMIN_PASSWORD` está
  nas variáveis de produção.
- Sessão JWT: papel e acesso decididos no login e válidos por 30 dias, sem revogação.
- Quase todas as rotas de escrita só conferem se há sessão; papel não é conferido no backend (exceto usuários e
  configurações).
- IP do cliente lido do primeiro `X-Forwarded-For` (o cliente controla); rate limit em memória (não vale com
  réplicas).
- Anexos de demanda (dados pessoais) e de jurídico iriam para URL pública do Cloudinary.

## 2. Isolamento entre condomínios

| Critério | Banco por organização | Schema por organização | Banco compartilhado + `organizationId` + RLS |
|---|---|---|---|
| Vazamento entre organizações | muito baixo | baixo | baixo com RLS forçado + camada obrigatória no backend |
| Custo no Railway | um Postgres por condomínio | um banco | um banco |
| Migrations | N bancos | N schemas (Prisma migra um schema por vez) | uma |
| Prisma | um cliente e um pool por banco | um cliente e um pool por schema | um cliente |
| Backup e restauração | por banco | por schema | banco inteiro + exportação por organização |
| Onboarding de condomínio | provisionar banco | criar schema e migrar | inserir organização |
| Operação e observabilidade | N serviços | N schemas | um |

**Decisão: banco compartilhado, `organizationId` em toda tabela de domínio, e duas camadas independentes.**
Condomínios são muitos e pequenos (o RST inteiro ocupa 9 MB); um banco ou schema por condomínio multiplicaria
custo, migrations e pools sem ganho proporcional.

1. **Backend:** todo acesso a dados de condomínio passa por um cliente Prisma com escopo de organização
   (`lib/tenant-db.ts`), que exige a organização, filtra leituras e preenche escritas. Não existe consulta de domínio
   sem organização.
2. **Banco:** Row-Level Security forçado em cada tabela de domínio (`organizationId =
   current_setting('app.organization_id')`), com o app conectado por um papel sem `BYPASSRLS` e que não é dono das
   tabelas. A organização vai por transação (`set_config(..., true)`); sem ela, nenhuma linha aparece.
3. **Integridade:** chaves estrangeiras compostas (`organizationId`, `id`) entre registros de domínio (lançamento →
   categoria, movimentação → demanda, voto → enquete/opção, notificação/multa → processo): um registro nunca aponta
   para outro de outra organização. Unicidades por organização (e-mail de conta, protocolo, número de processo, voto).

## 3. Modelo de organização

`organizations` (no COND): id, slug (igual ao da Platform), nome, nome curto, Platform organization id, status,
prefixo de protocolo, identidade visual (logo, cores complementares), contato, endereço, tribunal do DataJud,
módulos públicos. O RST: slug `santissima-trindade`, kind `Condominio` na Platform, prefixo de protocolo `RST`
(protocolos antigos seguem válidos). CNPJ e endereço vêm do cadastro real do portal; nada inventado.

## 4. Rotas

| Caminho | O que é |
|---|---|
| `/` | página do Orken COND (neutra) |
| `/{slug}` e páginas públicas (`/{slug}/financeiro`, `/{slug}/demandas/...`) | portal do condomínio |
| `/{slug}/admin/...` | gestão do condomínio |
| `/{slug}/api/...` | API do condomínio (organização resolvida no servidor pelo caminho) |
| `/entrar/{slug}` | entrada da equipe pelo Orken ID |
| organização inexistente ou inativa | 404 neutro |
| `www.transparenciarst.com.br/...` | depois do cutover, `308` para o caminho equivalente em `cond.orken.com.br/santissima-trindade` |

## 5. Identidade

- Equipe: Orken ID (Authorization Code + PKCE S256, state, nonce, redirect exato, MFA por `acr`/`amr`), acesso
  conferido na Platform por organização a cada requisição (cache curto, versão de acesso, feed de eventos só
  invalida), falha fechada, logout federado. Clientes `orken-cond-web` e `orken-cond-service`.
- Sessão própria no servidor (tabela `sessions`, cookie opaco `__Host-`, CSRF por origem e token), ligada à
  organização; papel e status da conta lidos do banco a cada requisição. NextAuth sai.
- Papéis locais (MASTER, SINDICO, GESTAO, CONSELHO) seguem decidindo o que a pessoa faz; matriz central em
  `lib/permissions.ts`, igual à de hoje. MASTER é local ao condomínio, nunca administrador da Platform.
- Vínculo gradual: conta ativa, e-mail verificado no Orken ID, uma conta só da organização com esse e-mail; o `sub`
  passa a identificar a pessoa e a senha local deixa de entrar. Conta não vinculada segue no login local,
  só na própria organização.
- Moradores: sem conta. Recursos públicos, demandas por protocolo e código, propostas e enquetes seguem abertos.

## 6. Arquivos

Cloudinary com pasta por organização (`orken-cond/{organizationId}/{módulo}`). Públicos (parecer publicado, planilha,
foto de obra e de membro) em entrega pública; anexos de demanda e do jurídico em entrega `authenticated`, servidos
só por rota autorizada com URL assinada curta. Nenhum objeto antigo removido.

## 7. Entrega

PRs em sequência, cada um com CI real verde:

1. Base: migration inicial idêntica ao banco atual, CI (lint, tipos, testes, build), testes de integração com
   Postgres e Redis reais, seed sem administrador padrão, correções de segurança sem mudança de modelo.
2. Organizações e isolamento: tabela de organizações, `organizationId` em tudo (expand), RLS, cliente com escopo,
   rotas por organização, página do produto.
3. Identidade: sessão própria, login local por organização, Orken ID, Platform, eventos, logout.
4. Arquivos, rate limit distribuído e LGPD.
5. Platform e Hub: organização RST, produto COND, clientes, entrada, production-watch.
6. Contract: `organizationId` obrigatório, papel de banco sem privilégios de dono, cutover de domínio.

## 8. Rollback

Cada migration é aditiva até o contract. Voltar o deploy de um PR anterior roda com o esquema novo. O contract só
roda depois de staging e produção validados; antes dele, há backup verificado e restauração ensaiada.
