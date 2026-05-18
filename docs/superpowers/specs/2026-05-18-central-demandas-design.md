# Central de Demandas — Design Spec

**Data:** 2026-05-18  
**Projeto:** Transparência RST — Portal do Condomínio Residencial Santíssima Trindade  
**Produto:** Andrade Systems  
**Status:** Aprovado para implementação

---

## Contexto

O portal já possui um módulo de **Propostas** (sugestões informais de moradores, sem protocolo). A Central de Demandas é um canal distinto: solicitações formais, rastreáveis, com protocolo único, código de acesso, histórico de movimentações e acompanhamento público.

**Decisão arquitetural:** módulos separados no banco de dados, reutilizando padrões de componentes, API e estrutura administrativa existentes (Opção C). Propostas permanecem como canal informal/participativo.

---

## Objetivos

- Permitir que moradores abram demandas formais com protocolo e rastreabilidade
- Gerar protocolo não-enumerável + código de acesso para consulta privada
- Permitir acompanhamento público apenas com protocolo + código (sem login)
- Dar à gestão uma área admin para listar, responder, atualizar status e encerrar demandas
- Registrar histórico completo de todas as movimentações
- Atender idosos e usuários pouco familiarizados com tecnologia (mobile-first, linguagem simples)
- Assinar o produto como desenvolvido pela Andrade Systems

---

## Schema Prisma

### Novos modelos

```prisma
model Demand {
  id             String         @id @default(cuid())
  protocol       String         @unique   // "RST-2026-K7M9Q2" — não sequencial
  accessCode     String                   // bcrypt hash do código de acesso
  requesterName  String
  unit           String                   // "Apto 302", "Bloco B 101"
  email          String?                  // opcional nesta fase
  phone          String
  ipAddress      String?                  // IP de criação (para logs)
  userAgent      String?                  // user-agent básico (para logs)
  category       DemandCategory
  title          String
  description    String         @db.Text
  attachmentUrl  String?                  // Cloudinary URL
  attachmentName String?
  status         DemandStatus   @default(RECEBIDA)
  closedAt       DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  updates        DemandUpdate[]

  @@index([protocol])
  @@index([status])
  @@index([category])
  @@index([createdAt])
}

model DemandUpdate {
  id             String        @id @default(cuid())
  demandId       String
  demand         Demand        @relation(fields: [demandId], references: [id], onDelete: Cascade)
  previousStatus DemandStatus?
  newStatus      DemandStatus
  message        String?       @db.Text
  createdById    String?                  // User.id — null para eventos de sistema
  createdBy      User?         @relation(fields: [createdById], references: [id])
  createdAt      DateTime      @default(now())

  @@index([demandId])
}

enum DemandCategory {
  MANUTENCAO
  SEGURANCA
  LIMPEZA
  FINANCEIRO
  BARULHO
  ILUMINACAO
  VAZAMENTO
  SUGESTAO
  RECLAMACAO
  OUTROS
}

enum DemandStatus {
  RECEBIDA
  EM_ANALISE
  EM_ANDAMENTO
  RESOLVIDA
  ENCERRADA_SEM_ACAO
}
```

### Alteração no modelo User existente

```prisma
// Adicionar em User:
demandUpdates DemandUpdate[]
```

### Labels de exibição

| Enum | Label público |
|---|---|
| `RECEBIDA` | Recebida |
| `EM_ANALISE` | Em análise |
| `EM_ANDAMENTO` | Em andamento |
| `RESOLVIDA` | Resolvida |
| `ENCERRADA_SEM_ACAO` | Encerrada sem ação |

| Enum | Label público |
|---|---|
| `MANUTENCAO` | Manutenção |
| `SEGURANCA` | Segurança |
| `LIMPEZA` | Limpeza |
| `FINANCEIRO` | Financeiro |
| `BARULHO` | Barulho |
| `ILUMINACAO` | Iluminação |
| `VAZAMENTO` | Vazamento |
| `SUGESTAO` | Sugestão |
| `RECLAMACAO` | Reclamação |
| `OUTROS` | Outros |

---

## Geração de Protocolo

- **Formato:** `RST-YYYY-XXXXXX` (ex: `RST-2026-K7M9Q2`)
- **Charset:** `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (exclui `0`, `O`, `1`, `I` — ambíguos)
- **Tamanho do código:** 6 a 8 caracteres aleatórios
- **Unicidade:** campo `@unique` no banco; implementar retry com até 5 tentativas em caso de colisão
- **Não sequencial:** impede enumeração de protocolos próximos

```typescript
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(length = 6): string {
  return Array.from({ length }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('')
}

function generateProtocol(year: number): string {
  return `RST-${year}-${generateCode(6)}`
}
```

---

## Código de Acesso

- **Formato:** 6 caracteres do mesmo charset (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
- **Armazenamento:** `bcrypt.hash(plainCode, 10)` no campo `accessCode`
- **Exibição:** plaintext **apenas uma vez**, na tela de sucesso após criação
- **Verificação pública:** `bcrypt.compare(inputCode.toUpperCase(), demand.accessCode)`
- **Jamais recuperável** após a criação — se perdido, o morador deve contatar a gestão/síndico

---

## Rate Limiting (consulta pública)

- **Limite:** 5 tentativas por IP por minuto no endpoint `/api/demandas/lookup`
- **Implementação MVP:** in-memory (Map com timestamp de expiração por IP)
- **Resposta em caso de falha de verificação:** `"Protocolo ou código inválido"` — nunca revelar qual dos dois está errado
- **Resposta em caso de rate limit:** HTTP 429
- **Evolução futura:** migrar para Redis sem alterar a interface da API

---

## Eventos de Histórico (DemandUpdate)

Todo evento relevante gera um `DemandUpdate`. Regra: **sem estado sem contexto**.

| Evento | previousStatus | newStatus | message | createdById |
|---|---|---|---|---|
| Abertura da demanda | `null` | `RECEBIDA` | "Demanda registrada." | `null` |
| Mudança de status + mensagem | status anterior | novo status | mensagem da gestão | id do admin |
| Encerramento | status anterior | `RESOLVIDA` ou `ENCERRADA_SEM_ACAO` | mensagem opcional | id do admin |

O status e a mensagem são sempre salvos **juntos** em uma única operação — nunca status sem mensagem de contexto quando iniciado por admin.

---

## Rotas

### Públicas

| Rota | Descrição |
|---|---|
| `/demandas` | Hub — dois botões grandes (Abrir / Acompanhar) |
| `/demandas/nova` | Formulário de abertura da demanda |
| `/demandas/acompanhar` | Formulário de consulta (protocolo + código) |
| `/demandas/acompanhar/[protocol]` | Detalhe público da demanda (sem dados pessoais) |

### Administrativas (autenticadas — todos os roles)

| Rota | Descrição |
|---|---|
| `/admin/demandas` | Lista com filtros |
| `/admin/demandas/[id]` | Detalhe, resposta, status, histórico |

---

## API Endpoints

### Públicos

#### `POST /api/demandas`
Cria nova demanda. Público, sem autenticação.

**Body:**
```json
{
  "requesterName": "string (obrigatório)",
  "unit": "string (obrigatório)",
  "phone": "string (obrigatório)",
  "email": "string (opcional)",
  "category": "DemandCategory (obrigatório)",
  "title": "string (obrigatório, max 120 chars)",
  "description": "string (obrigatório, max 2000 chars)",
  "attachmentUrl": "string (opcional)",
  "attachmentName": "string (opcional)"
}
```

**Comportamento:**
1. Valida campos com Zod
2. Sanitiza `title` e `description` (strip HTML)
3. Gera protocolo não-sequencial (com retry em colisão)
4. Gera código de acesso em plaintext
5. Salva `bcrypt.hash(accessCode, 10)` no banco
6. Registra IP e user-agent nos campos de log
7. Cria `DemandUpdate` inicial (RECEBIDA, system)
8. Retorna `{ protocol, accessCode }` — única vez que accessCode é exposto

**Resposta 201:**
```json
{ "protocol": "RST-2026-K7M9Q2", "accessCode": "X7K9P2" }
```

---

#### `POST /api/demandas/lookup`
Consulta pública por protocolo + código.

**Body:**
```json
{ "protocol": "RST-2026-K7M9Q2", "accessCode": "X7K9P2" }
```

**Comportamento:**
1. Rate limit: 5 req/min por IP
2. Busca demand pelo `protocol`
3. `bcrypt.compare(accessCode.toUpperCase(), demand.accessCode)`
4. Se válido: retorna dados **não-pessoais** + histórico
5. Se inválido: sempre retorna `"Protocolo ou código inválido"` (nunca discrimina)

**Resposta 200 (dados públicos — sem PII):**
```json
{
  "protocol": "RST-2026-K7M9Q2",
  "status": "EM_ANDAMENTO",
  "category": "VAZAMENTO",
  "title": "Infiltração no teto do corredor",
  "description": "...",
  "createdAt": "2026-05-18T...",
  "updates": [
    {
      "previousStatus": "RECEBIDA",
      "newStatus": "EM_ANALISE",
      "message": "Demanda encaminhada ao síndico.",
      "createdAt": "2026-05-19T..."
    }
  ]
}
```

**Campos jamais retornados neste endpoint:** `id`, `requesterName`, `unit`, `email`, `phone`, `accessCode`, `ipAddress`, `userAgent`

**Anexo:** `attachmentUrl` e `attachmentName` **são retornados** — o morador pode visualizar/baixar o próprio arquivo que enviou. São dados que o próprio solicitante submeteu, não dados pessoais de terceiros.

---

### Administrativos (requerem sessão autenticada)

#### `GET /api/demandas`
Lista demandas com filtros opcionais.

**Query params:** `status`, `category`, `search` (busca por protocolo ou título), `page`, `limit`

**Retorna:** todos os campos incluindo dados pessoais

---

#### `GET /api/demandas/[id]`
Detalhe completo da demanda, incluindo dados pessoais e histórico completo.

---

#### `PUT /api/demandas/[id]`
Atualiza status + mensagem em uma única operação.

**Body:**
```json
{
  "newStatus": "DemandStatus (obrigatório)",
  "message": "string (obrigatório para mudanças de status por admin)"
}
```

**Comportamento:**
1. Valida que `newStatus` é uma transição válida
2. Cria `DemandUpdate` com `previousStatus`, `newStatus`, `message`, `createdById`
3. Atualiza `demand.status` e `demand.updatedAt`
4. Se `newStatus` é `RESOLVIDA` ou `ENCERRADA_SEM_ACAO`, define `closedAt`

---

#### `POST /api/demandas/[id]/encerrar`
Encerra demanda com confirmação explícita. O admin escolhe explicitamente o status final.

**Body:**
```json
{
  "finalStatus": "RESOLVIDA | ENCERRADA_SEM_ACAO (obrigatório)",
  "message": "string (opcional)"
}
```

- `RESOLVIDA`: problema foi tratado e solucionado
- `ENCERRADA_SEM_ACAO`: demanda recebida mas não será atendida (duplicada, fora de escopo, etc.)

**Comportamento:** valida `finalStatus`, cria `DemandUpdate`, define `demand.status = finalStatus` e `demand.closedAt = now()`. A distinção entre os dois status finais é responsabilidade do admin — o endpoint aceita ambos mas exige escolha explícita (sem default).

---

## Validação e Segurança

- **Zod** em todos os endpoints (server-side, sem depender do cliente)
- **Sanitização:** strip HTML em `title`, `description`, `message` antes de salvar
- **Upload:** validar MIME type no backend (`image/jpeg`, `image/png`, `application/pdf`); limite de 10MB via Cloudinary config
- **Payload:** limite de body JSON no Next.js (`2mb`). Upload de arquivo segue o fluxo existente: frontend → `POST /api/upload` → retorna URL Cloudinary → URL incluída no body do `POST /api/demandas`. O arquivo nunca passa pelo body JSON da criação da demanda.
- **IDs internos:** nunca expostos na API pública; toda consulta pública usa `protocol`
- **Rate limiting:** 5 req/min por IP no lookup (in-memory para MVP)

---

## Fluxo Público — UX

### Hub `/demandas`
- Dois botões grandes, mobile-friendly
- Descrição curta e objetiva
- Nota explicativa sobre protocolo e código de acesso
- Sem menu técnico, sem submenu

### Formulário `/demandas/nova`
- Campos obrigatórios: nome, unidade, telefone, categoria, título, descrição
- Campos opcionais: e-mail, anexo
- Labels com `*` para obrigatório
- Upload: "📎 Foto ou documento · JPG, PNG ou PDF · máx. 10MB"
- Botão único "Enviar Demanda"

### Tela de sucesso (após POST)
- Ícone ✅ grande
- Protocolo em caixa verde destacada com botão "Copiar protocolo"
- Código de acesso em caixa âmbar destacada com botão "Copiar código"
- **Aviso em negrito e tamanho maior:** "Este código será exibido apenas agora. Guarde-o para acompanhar sua demanda."
- Aviso repetido abaixo dos botões de copiar
- Feedback visual "Copiado com sucesso" ao clicar copiar
- Botão "Acompanhar esta demanda" (leva para lookup pré-preenchido)

### Consulta `/demandas/acompanhar`
- Campos grandes, mobile-friendly
- Placeholder: "Ex: RST-2026-K7M9Q2"
- Nota: "Não diferencia maiúsculas/minúsculas"
- Erro genérico: "Protocolo ou código inválido. Verifique os dados e tente novamente."

### Detalhe público `/demandas/acompanhar/[protocol]`
Exibe apenas:
- Protocolo
- Status (com badge visual)
- Categoria
- Título
- Descrição
- Anexo original do solicitante (link/botão de download, se houver)
- Data de abertura (formato: "18 de maio de 2026")
- Histórico com linguagem amigável:
  - "Recebida", "Em análise", "Respondida pela gestão", "Resolvida"
  - Timestamps: "19 de maio às 09h14" (sem ISO, sem timezone técnico)
  - Mensagem da gestão em destaque
- Nota de privacidade: "Por questões de privacidade e segurança, informações pessoais do solicitante não são exibidas nesta consulta."

**Jamais exibe:** nome, unidade, e-mail, telefone, IP, user-agent, id interno

---

## Fluxo Admin — UX

### Lista `/admin/demandas`
- Filtros: status (chips), categoria (select), período (date range), busca livre
- Busca inclui protocolo — campo com placeholder "Buscar por protocolo ou título"
- Protocolo exibido em fonte monospace semi-bold + botão copiar em cada linha
- Ordem padrão: mais recentes primeiro
- Paginação

### Detalhe `/admin/demandas/[id]`
- **Caixa de dados pessoais** visualmente separada (fundo âmbar, borda, ícone 🔒, label "Informações restritas à gestão do condomínio") — no topo da tela, antes da descrição
- Campos: nome, unidade, telefone, e-mail (se informado), protocolo, data de abertura, anexo (link)
- **Fluxo unificado:** selecionar novo status + escrever mensagem → salvar em uma única ação
  - Ambos obrigatórios quando status muda via admin
- **Encerrar demanda:** botão separado → modal de confirmação → campo de mensagem final opcional → confirmar encerramento → gera DemandUpdate automaticamente
- **Histórico:** ordem cronológica crescente, badges de status, timestamps amigáveis, nome do responsável, destaque visual para respostas da gestão

---

## Histórico: rastreabilidade total

Eventos que **obrigatoriamente** geram `DemandUpdate`:

1. Abertura da demanda (status: RECEBIDA, createdById: null)
2. Mudança de status + mensagem pelo admin
3. Encerramento (com mensagem opcional)
4. Qualquer resposta administrativa

---

## Marca Andrade Systems

| Local | Texto |
|---|---|
| Rodapé público (todas as páginas) | "Desenvolvido por Andrade Systems" |
| Rodapé admin (layout admin) | "Desenvolvido por Andrade Systems" |
| `<head>` do layout raiz | `<meta name="generator" content="Andrade Systems">` |
| `package.json` | `"author": "Andrade Systems"` |
| `README.md` | Seção "Desenvolvido por Andrade Systems" |

Posicionamento: discreto, sem competir com o conteúdo institucional do condomínio.

---

## Navegação

- **Navbar público:** item "Central de Demandas" → `/demandas` (hub)
- **Sidebar admin:** item "Demandas" entre "Propostas" e "Enquetes" (ou após Propostas)
- Middleware: sem alteração — `/admin/*` já está protegido; `/demandas/*` é público

---

## Logs (preparado, não exposto na UI)

Campos salvos na criação de cada demanda:
- `ipAddress`: IP do request (header `x-forwarded-for` ou `req.ip`)
- `userAgent`: `request.headers.get('user-agent')`
- `createdAt`: timestamp completo (UTC, automático via Prisma)

Não aparecem em nenhuma tela pública ou admin nesta versão.

---

## Critérios de Aceite

A feature está pronta quando:

- [ ] Morador consegue abrir demanda pelo formulário público
- [ ] Sistema gera protocolo não-sequencial (RST-ANO-CÓDIGO)
- [ ] Sistema gera código de acesso de 6 chars
- [ ] Tela de sucesso exibe protocolo + código com avisos claros
- [ ] Botões de copiar funcionam com feedback visual
- [ ] Morador consegue consultar demanda pelo protocolo + código
- [ ] Consulta pública não exibe dados pessoais
- [ ] Rate limiting bloqueia após 5 tentativas/min
- [ ] Admin consegue listar demandas com filtros
- [ ] Admin consegue ver todos os dados incluindo pessoais (caixa restrita)
- [ ] Admin consegue alterar status + mensagem em uma única ação
- [ ] Admin consegue encerrar demanda com confirmação e mensagem opcional
- [ ] Todo evento gera DemandUpdate no histórico
- [ ] Histórico exibe responsável, timestamp e transição de status
- [ ] Assinatura "Desenvolvido por Andrade Systems" aparece no rodapé
- [ ] Build passa sem erros
- [ ] Deploy compatível com Railway (sem variáveis novas além das já existentes)

---

## Fora do escopo desta versão

- Notificações por e-mail ao morador
- Painel de métricas públicas agregadas
- Múltiplos anexos por demanda
- Exportação de demandas
- Integração com outros canais (WhatsApp, etc.)
