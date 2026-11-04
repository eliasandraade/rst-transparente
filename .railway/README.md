# Infraestrutura no Railway (IaC)

`railway.ts` descreve o serviço do app (`rst-transparente`) no projeto `rst-transparente` do Railway, em staging e em
produção. Ele substitui o antigo `railway.toml`, porque o Railway deixa de ler Config as Code em 2026-12-01.

O arquivo grava no serviço:
- **build:** Railpack, com `npx prisma generate && npm run build`;
- **start:** `node scripts/db-migrate.mjs && npm run start`, que aplica as migrations como dono do banco antes do app;
- **healthcheck:** `/api/health`, com 60 s;
- **restart:** `ON_FAILURE`, com 3 tentativas;
- **sleep:** ligado;
- **réplicas:** 1 em `europe-west4`;
- **origem:** `main`.

Regras do arquivo:
- **Só o app:** o arquivo é um `partial` (`rst-transparente`). Postgres, Redis e os volumes não aparecem nele, e o
  `apply` nunca os altera nem os apaga.
- **Variáveis fora** (`variables: { managed: false }`): segredos ficam no Railway, nunca aqui.
- **Domínios próprios** (`cond.orken.com.br`, `www.transparenciarst.com.br`) só em produção. Staging mantém o domínio
  do Railway.
- **Ambientes:** só staging e produção. Qualquer outro ambiente é recusado.

## Uso

```bash
cd .railway && npm ci && cd ..
railway config plan --environment staging
railway config apply --environment staging
```

No Windows, com a CLI instalada pelo npm, o SDK não acha o `railway.cmd` e acusa "requires Railway CLI 5.42.1". Rode
pelo PowerShell apontando `$env:_` para o binário nativo:

```powershell
$env:_ = "$env:APPDATA\npm\node_modules\@railway\cli\bin\railway.exe"; & $env:_ config plan --environment staging
```

Revise sempre o `plan` antes do `apply`. Uma remoção (`to destroy`) inesperada é motivo para parar.

## Ordem da migração (2026-11-04) e rollback

1. `apply` em staging, depois em produção: grava no serviço os mesmos valores do `railway.toml`. Em produção, o efeito
   não muda, porque o arquivo e o serviço passam a dizer a mesma coisa.
2. Merge do PR que remove `railway.toml`: os deploys passam a usar só o que está no serviço.

Para reverter, há duas saídas:
- **Repositório:** recolocar o `railway.toml` (revert do commit). Enquanto o Railway ainda ler Config as Code, até
  2026-12-01, o arquivo volta a valer no deploy seguinte.
- **Railway:** as configurações gravadas no serviço continuam lá até um novo `apply`. Para voltar um campo, edite o
  `railway.ts` e rode `plan` e `apply`. `railway config migrate undo` restaura o caminho de arquivo salvo por um
  `cutover`.
