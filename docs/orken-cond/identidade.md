# Orken COND — sessões, Orken ID e Platform

A equipe de cada condomínio (síndico, gestão, conselho, administração) entra pela conta Orken, com MFA, e o COND é
liberado por organização e por pessoa na Orken Platform. Moradores não têm conta: portal, demandas por protocolo e
código, propostas e enquetes seguem abertos. Contrato da Platform: `orken-platform/docs/architecture/oidc-and-api-contracts.md`.

## 1. Quem decide o quê

| Pergunta | Quem responde |
|---|---|
| Esta pessoa pode usar o COND neste condomínio? | Platform: organização com o COND habilitado, membership ativa e grant do COND |
| O que ela faz aqui dentro? | Papel local (MASTER, SINDICO, GESTAO, CONSELHO), matriz em `lib/permissions.ts` |

Nenhum dos dois decide pelo outro. MASTER é local ao condomínio, nunca administrador da Platform; ter acesso ao COND
na Platform não cria conta nem papel local.

## 2. Sessão

- Cookie opaco `__Host-cond_session` (HttpOnly, Secure, SameSite=Lax, host-only); no banco, só o hash
  (`staff_sessions`, com RLS). A sessão é da organização em que foi aberta: o cliente com escopo nem enxerga a de outra.
- Papel e status da conta relidos a cada requisição (`lib/staff.ts`). Conta desativada: sessão revogada na hora.
- Expira com 12 h sem uso ou 7 dias de idade; revogada por logout, desativação, vínculo ao Orken ID (sessões de senha),
  troca de senha (as outras sessões) e negação da Platform.
- CSRF: escrita na API só da própria origem; com sessão, o cabeçalho `x-cond-csrf` precisa repetir o cookie
  `__Host-cond_csrf`, e o cookie precisa ser o da sessão (hash guardado nela).
- Auditoria em `staff_audit_events`: `LOGIN_PASSWORD`, `LOGIN_FAILED`, `ORKEN_LOGIN`, `ORKEN_LINKED`, `ORKEN_DENIED`,
  `LOGOUT`, `PLATFORM_ACCESS_DENIED`. Nunca senha, token, código, state, nonce ou segredo.

## 3. Variáveis

Todas ou nenhuma (`lib/orken/config.ts`, validado no boot). Nenhuma: só o login local, sem o botão da conta Orken.

| Variável | Produção |
|---|---|
| `ORKEN_ISSUER` | `https://account.orken.com.br` |
| `ORKEN_CLIENT_ID` / `ORKEN_CLIENT_SECRET` | `orken-cond-web` / segredo do cliente |
| `PLATFORM_API_URL` | `https://api.orken.com.br` |
| `ORKEN_SERVICE_CLIENT_ID` / `ORKEN_SERVICE_CLIENT_SECRET` | `orken-cond-service` / segredo do cliente de serviço |
| `APP_BASE_URL` | `https://cond.orken.com.br` (callback e retorno do logout saem daqui, nunca da requisição) |
| `PLATFORM_EVENTS_SYNC` | `on` (padrão); `off` deixa só o TTL do cache |

Clientes na Platform: `orken-cond-web` (Authorization Code + PKCE, redirect `https://cond.orken.com.br/api/auth/orken/callback`,
post-logout `https://cond.orken.com.br/`, `openid profile email`) e `orken-cond-service` (client credentials, produto
`COND`, `platform.tenancy.read platform.events.read`). Cada condomínio guarda a sua organização da Platform
(`organizations.platformOrganizationId`), gravada por `node scripts/platform-link.mjs <slug> --apply`, que a resolve
pela própria Platform (nenhum UUID digitado à mão).

## 4. Entrada pela conta Orken

Minha Orken → condomínio → Orken COND → `https://cond.orken.com.br/entrar/<slug>`.

1. `/entrar/<slug>` resolve o condomínio (inexistente ou desativado: o 404 dele; sem vínculo com a Platform:
   `desligado`), guarda a transação no Redis por 10 min (`cond:orken:tx:<sha256(state)>`: organização, nonce,
   verifier), prende o state ao navegador (`__Host-cond_orken`) e manda ao Orken ID com PKCE S256, state, nonce,
   `acr_values=urn:orken:acr:mfa` e o slug como dica.
2. `/api/auth/orken/callback`: state igual ao do cookie e transação consumida uma vez (`GETDEL`); código trocado com o
   verifier (`client_secret_basic`); ID token RS256 pela chave do JWKS do emissor, `iss`, `aud`/`azp`, validade com
   60 s de folga, no máximo 10 min de idade, `nonce` e `sub` UUID; MFA (`acr` de MFA e `amr` com `mfa`); condomínio
   ainda ativo; Platform `GET /v1/tenants/<org>/access/<sub>` com `allowed`; conta local (seção 5); sessão
   `ORKEN_ID`; painel do condomínio.
3. Recusa volta a `/<slug>/admin/login?orken=<motivo>`: `desligado`, `cancelado`, `expirado`, `mfa`, `sem_acesso`,
   `sem_conta`, `inativa`, `indisponivel`, `erro`. Sem transação: a página do produto, nunca o portal de outro condomínio.

## 5. Vínculo com a conta local

Depois do vínculo, a identidade é o `sub` do Orken ID (o e-mail pode mudar lá sem efeito aqui). O primeiro vínculo só
acontece quando tudo é inequívoco: e-mail verificado no Orken ID, exatamente uma conta desta organização com esse
e-mail, ativa e sem outro vínculo. Vínculo, revogação das sessões de senha e auditoria numa transação; o índice único
(organização, `sub`) resolve corrida. A mesma pessoa pode ser da equipe de vários condomínios: o vínculo é por
organização.

Conta vinculada: senha local recusada com a mesma resposta e o mesmo custo da senha errada; troca de senha responde
`ORKEN_MANAGED`; a lista de usuários mostra "Conta Orken". Conta ainda não vinculada segue no login local, só no
próprio condomínio ("Acesso com senha local").

Desfazer (rollback): `node scripts/orken-unlink.mjs <slug> <email>` e depois `--apply`; encerra as sessões do Orken ID.

## 6. Portão por requisição e feed

Sessão do Orken ID passa pela Platform a cada requisição, com a resposta em memória por 60 s por organização, pessoa e
versão de acesso. Negado: sessão revogada e auditada. Platform fora do ar ou cliente não configurado: erro (nunca um sim
implícito, nem logout por pane). Erro nunca fica em cache.

O consumidor do feed (`lib/orken/events.ts`, agendado em `instrumentation.ts` em todas as réplicas) lê a cada 15 s,
recuando até 5 min se a Platform falhar. Cursor movido por compare-and-set (`platform_event_cursors`), recibo por
evento (`platform_event_receipts`, 14 dias). `organization.updated`, `organization.product_enabled/disabled`,
`entitlement.changed` e `membership.created/changed/removed` de um condomínio atendido sobem a versão de acesso
(`platform_access_state`): todas as réplicas perguntam de novo. Evento nunca concede nada.

## 7. Logout

`POST /<slug>/api/auth/logout` revoga a sessão e limpa os cookies antes de qualquer chamada externa. Sessão do Orken
ID recebe `endSessionUrl` (`id_token_hint`, `client_id`, `post_logout_redirect_uri`, `state`) e o navegador segue
para o logout federado; as outras voltam ao login do condomínio.

## 8. Provas

`tests/integration/orken.test.ts`, com Orken ID e Platform falsos (chaves RSA de teste): PKCE, state preso ao
navegador e de uso único, MFA, assinatura de outra chave, cancelamento, Platform negando ou fora, e-mail não
verificado, primeiro vínculo, senha recusada depois do vínculo, revogação pela Platform derrubando a sessão depois do
evento, restauração com novo login, feed sem repetir e sem mexer em outra organização, logout federado. Tudo pelo
papel `cond_app` com RLS no CI.
