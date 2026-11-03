# Orken COND — operação

Comandos rodados no serviço do COND (`railway ssh`, diretório `/app`), com as variáveis do próprio serviço. Todos
mostram o que fariam e só gravam com `--apply`. Nada tem valor padrão nem é inventado: sem o dado, o comando não roda.

## Condomínio novo

1. **Platform** (serviço `identity`, por um PLATFORM_ADMIN): `create-organization` com `"kind": "CONDOMINIO"` e
   `"products": { "COND": { "status": "ACTIVE" } }`, sem plano e sem CNPJ enquanto não confirmados
   (`orken-platform/docs/operations/cond-integration.md`).
2. **COND**: `node scripts/organization-create.mjs <organizacao.json>` e depois `--apply`. O slug é o mesmo da
   Platform; nome, nome curto, prefixo de protocolo (2 a 6 letras, único) e tribunal do DataJud vêm do condomínio;
   a planta (blocos e unidades) é opcional. Cria também a configuração do portal com o nome oficial.
3. **Vínculo**: `node scripts/platform-link.mjs <slug>` e depois `--apply` (a organização é resolvida pela própria
   Platform; só aparece com o COND habilitado nela).
4. **Primeira pessoa da gestão**: `node scripts/staff-create.mjs <slug> <email> "<nome>" <papel>` e depois `--apply`.
   A conta nasce sem senha conhecida e entra pela conta Orken: o primeiro login com o mesmo e-mail verificado a
   vincula. O papel é sempre explícito. As demais pessoas são criadas por ela na tela de usuários.
5. **Acesso na Platform**: membership da pessoa na organização e `set-product-access <slug> <email> COND on <operador>`.

O portal fica em `https://cond.orken.com.br/<slug>`; a gestão, pela Minha Orken ou por `/entrar/<slug>`.

## Rollback

| Situação | Comando |
|---|---|
| Vínculo de conta ao Orken ID | `node scripts/orken-unlink.mjs <slug> <email>` e `--apply` (encerra as sessões do Orken ID) |
| Acesso de uma pessoa | Platform: `set-product-access <slug> <email> COND off <operador>` (o feed derruba a sessão aberta) |
| Deploy | Railway: redeploy da versão anterior; migrations são aditivas até o contract |
| Dados | Backup verificado antes de cada migration de produção (`docs/orken-cond/arquitetura.md`, "Deploy em produção") |
