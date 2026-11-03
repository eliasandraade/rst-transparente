# Orken COND

Gestão, transparência e relacionamento condominial da Andrade Systems, parte da Orken Platform. Cada condomínio é uma
organização com o próprio portal: contas publicadas pelo conselho, Central de Demandas com protocolo, avisos,
enquetes, obras, propostas, jurídico e a gestão no mesmo lugar.

| Caminho | O que é |
|---|---|
| `/` | Página do Orken COND |
| `/{slug}` | Portal do condomínio (moradores, sem conta) |
| `/{slug}/admin` | Gestão do condomínio (equipe) |
| `/entrar/{slug}` | Entrada da equipe pela conta Orken (Minha Orken → condomínio → Orken COND) |

Arquitetura, isolamento entre condomínios e migração: [docs/orken-cond/arquitetura.md](docs/orken-cond/arquitetura.md).
Sessões, Orken ID e Platform: [docs/orken-cond/identidade.md](docs/orken-cond/identidade.md).

## Stack

Next.js 15 (App Router), React 19, TypeScript, Prisma 5 + PostgreSQL (RLS por organização), Redis (rate limit e
transações de login), Tailwind, Cloudinary, Vitest. Deploy no Railway.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local      # DATABASE_URL e REDIS_URL de um banco/Redis locais
npm run db:migrate              # migrations versionadas (nunca db push)
ALLOW_DEMO_SEED=1 SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed:demo
npm run dev
```

O seed de demonstração cria só a organização `condominio-demo`, exige senha de 12+ caracteres vinda do ambiente,
nunca roda em produção e nunca imprime credenciais. Portal em `http://localhost:3000/condominio-demo`.

## Testes

```bash
npm run lint && npm run typecheck && npm test
DATABASE_URL=... REDIS_URL=... npm run test:integration   # banco DESCARTÁVEL: a suíte grava e apaga dados
```

O CI (GitHub Actions) roda lint, tipos, testes de unidade, migrations num banco limpo e numa instalação antiga com
dados, a suíte de integração duas vezes (dono das tabelas e papel `cond_app` sem `BYPASSRLS`), o build e o servidor
de produção de pé.

## Variáveis

| Variável | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL |
| `REDIS_URL` | Rate limit e transações de login (obrigatório em produção: sem Redis, falha fechado) |
| `CLIENT_IP_HEADER` | Cabeçalho com o IP real do cliente (`x-real-ip` no Railway) |
| `CLOUDINARY_*` | Arquivos (públicos e privados por organização, `lib/files.ts`) |
| `IP_HASH_SECRET` | Pseudônimo de IP por organização (obrigatória em produção; `docs/orken-cond/lgpd.md`) |
| `DATAJUD_API_KEY` | Sincronização de processos (tribunal por organização) |
| `LEGACY_HOST_ORGANIZATION` | Host antigo de um condomínio só → `308` para `/{slug}/...` |
| `LEGACY_HOST_TARGET` | Cutover: o host antigo manda tudo para o mesmo caminho nesta origem (`https://cond.orken.com.br`) |
| `ORKEN_*`, `PLATFORM_API_URL`, `APP_BASE_URL` | Orken ID e Platform: todas ou nenhuma (`.env.example`) |

## Deploy

`railway.toml`: o start roda `scripts/db-migrate.mjs` (migrations) e sobe o app; saúde em `/api/health`. Ordem de um
deploy com migration e conferências: `docs/orken-cond/arquitetura.md`.
