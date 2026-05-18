# Central de Demandas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a Central de Demandas no portal RST Transparente — formulário público de abertura, protocolo aleatório + código de acesso, acompanhamento público por protocolo/código, e área admin completa com histórico rastreável.

**Architecture:** Módulo completamente novo (Demand + DemandUpdate no Prisma), separado do módulo Propostas existente, seguindo os padrões estabelecidos do projeto. APIs públicas sem auth; APIs admin com `auth()` do NextAuth. Componentes client-side para formulários, server components para páginas de leitura.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma + PostgreSQL, NextAuth v5, bcryptjs, Zod v4, Tailwind CSS, Radix UI, Lucide React, Cloudinary (upload via `/api/upload` existente)

---

## File Map

**Modificar:**
- `prisma/schema.prisma` — adicionar Demand, DemandUpdate, enums, relação em User
- `lib/utils.ts` — adicionar formatarDataExtenso, formatarDataHoraAmigavel
- `components/public/Navbar.tsx` — adicionar link "Central de Demandas"
- `components/public/Footer.tsx` — adicionar "Desenvolvido por Andrade Systems"
- `components/admin/AdminNav.tsx` — adicionar item "Demandas"
- `app/layout.tsx` — adicionar meta generator
- `package.json` — adicionar campo author

**Criar:**
- `lib/demandas.ts` — generateCode, generateProtocol, sanitizeText, checkRateLimit
- `app/api/demandas/route.ts` — POST público + GET admin
- `app/api/demandas/lookup/route.ts` — POST lookup público com rate limit
- `app/api/demandas/[id]/route.ts` — GET + PUT admin
- `app/api/demandas/[id]/encerrar/route.ts` — POST encerrar admin
- `app/(public)/demandas/page.tsx` — hub público
- `app/(public)/demandas/nova/page.tsx` — página do formulário
- `app/(public)/demandas/acompanhar/page.tsx` — página de consulta
- `app/(public)/demandas/acompanhar/[protocol]/page.tsx` — detalhe público
- `app/admin/demandas/page.tsx` — lista admin
- `app/admin/demandas/[id]/page.tsx` — detalhe admin
- `components/public/NovaDemandaForm.tsx` — formulário de abertura
- `components/public/DemandaSuccessView.tsx` — tela de sucesso com protocolo/código
- `components/public/AcompanharDemandaForm.tsx` — formulário de consulta
- `components/public/DemandaDetalhePublico.tsx` — detalhe público (exibe histórico)
- `components/admin/DemandaFiltros.tsx` — filtros client-side para lista admin
- `components/admin/DemandaAtualizarForm.tsx` — form unificado status+mensagem
- `components/admin/DemandaEncerrarModal.tsx` — modal de confirmação de encerramento

---

## Task 1: Schema Prisma — Novos modelos

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar enums e modelos ao schema**

Abrir `prisma/schema.prisma` e adicionar ao final do arquivo (antes do último `@@map`), após o model `ConfigPortal`:

```prisma
// ─── Central de Demandas ──────────────────────────────────────────────────────

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

model Demand {
  id             String         @id @default(cuid())
  protocol       String         @unique
  accessCode     String
  requesterName  String
  unit           String
  email          String?
  phone          String
  ipAddress      String?
  userAgent      String?
  category       DemandCategory
  title          String
  description    String         @db.Text
  attachmentUrl  String?
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
  @@map("demands")
}

model DemandUpdate {
  id             String        @id @default(cuid())
  demandId       String
  demand         Demand        @relation(fields: [demandId], references: [id], onDelete: Cascade)
  previousStatus DemandStatus?
  newStatus      DemandStatus
  message        String?       @db.Text
  createdById    String?
  createdBy      User?         @relation(fields: [createdById], references: [id])
  createdAt      DateTime      @default(now())

  @@index([demandId])
  @@map("demand_updates")
}
```

- [ ] **Step 2: Adicionar relação inversa em User**

No model `User` (logo após `updatedAt DateTime @updatedAt`), adicionar:

```prisma
  demandUpdates  DemandUpdate[]
```

O model User deve ficar assim no trecho final:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(CONSELHO)
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  demandUpdates  DemandUpdate[]

  @@map("users")
}
```

- [ ] **Step 3: Aplicar migration no banco**

```bash
npm run db:push
```

Saída esperada: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Verificar tabelas criadas**

```bash
npm run db:studio
```

Confirmar que as tabelas `demands` e `demand_updates` aparecem no Prisma Studio.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): adicionar Demand, DemandUpdate e enums Central de Demandas"
```

---

## Task 2: lib/demandas.ts — Funções utilitárias

**Files:**
- Create: `lib/demandas.ts`

- [ ] **Step 1: Criar o arquivo de utilitários**

Criar `lib/demandas.ts`:

```typescript
import bcrypt from "bcryptjs";

// Charset sem caracteres ambíguos (0, O, 1, I removidos)
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 6): string {
  return Array.from(
    { length },
    () => CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join("");
}

export function generateProtocol(year: number): string {
  return `RST-${year}-${generateCode(6)}`;
}

export async function hashAccessCode(plainCode: string): Promise<string> {
  return bcrypt.hash(plainCode, 10);
}

export async function verifyAccessCode(
  input: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(input.toUpperCase(), hash);
}

export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

// Rate limiter in-memory (MVP — migrar para Redis se necessário)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  ip: string,
  limit = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Saída esperada: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add lib/demandas.ts
git commit -m "feat(lib): utilitários Central de Demandas — generateProtocol, rateLimit, sanitize"
```

---

## Task 3: lib/utils.ts — Formatadores de data amigáveis

**Files:**
- Modify: `lib/utils.ts`

- [ ] **Step 1: Adicionar duas funções de formatação de data**

No final de `lib/utils.ts`, adicionar:

```typescript
export function formatarDataExtenso(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export function formatarDataHoraAmigavel(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

Saída esperada: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat(utils): adicionar formatarDataExtenso e formatarDataHoraAmigavel"
```

---

## Task 4: POST /api/demandas — Criar demanda (público)

**Files:**
- Create: `app/api/demandas/route.ts`

- [ ] **Step 1: Criar o endpoint público de criação**

Criar `app/api/demandas/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { DemandStatus, DemandCategory } from "@prisma/client";
import {
  generateProtocol,
  generateCode,
  hashAccessCode,
  sanitizeText,
  getClientIp,
} from "@/lib/demandas";

const CreateDemandSchema = z.object({
  requesterName: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(100),
  unit: z.string().min(1, "Informe a unidade/apartamento").max(50),
  phone: z.string().min(8, "Telefone inválido").max(20),
  email: z.string().email("E-mail inválido").optional().nullable(),
  category: z.enum([
    "MANUTENCAO", "SEGURANCA", "LIMPEZA", "FINANCEIRO", "BARULHO",
    "ILUMINACAO", "VAZAMENTO", "SUGESTAO", "RECLAMACAO", "OUTROS",
  ]),
  title: z.string().min(5, "Título muito curto").max(120),
  description: z.string().min(10, "Descrição muito curta").max(2000),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateDemandSchema.parse(body);

    const year = new Date().getFullYear();
    const plainAccessCode = generateCode(6);
    const hashedAccessCode = await hashAccessCode(plainAccessCode);

    // Gerar protocolo único com retry (até 5 tentativas em caso de colisão)
    let protocol = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateProtocol(year);
      const exists = await prisma.demand.findUnique({
        where: { protocol: candidate },
      });
      if (!exists) {
        protocol = candidate;
        break;
      }
    }
    if (!protocol) {
      return NextResponse.json(
        { error: "Erro ao gerar protocolo. Tente novamente." },
        { status: 500 }
      );
    }

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const demand = await prisma.$transaction(async (tx) => {
      const created = await tx.demand.create({
        data: {
          protocol,
          accessCode: hashedAccessCode,
          requesterName: sanitizeText(data.requesterName),
          unit: sanitizeText(data.unit),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
          category: data.category,
          title: sanitizeText(data.title),
          description: sanitizeText(data.description),
          attachmentUrl: data.attachmentUrl || null,
          attachmentName: data.attachmentName || null,
          ipAddress,
          userAgent,
        },
      });

      await tx.demandUpdate.create({
        data: {
          demandId: created.id,
          previousStatus: null,
          newStatus: "RECEBIDA",
          message: "Demanda registrada.",
          createdById: null,
        },
      });

      return created;
    });

    return NextResponse.json(
      { protocol: demand.protocol, accessCode: plainAccessCode },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[POST /api/demandas]", err);
    return NextResponse.json(
      { error: "Erro ao registrar demanda." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const demands = await prisma.demand.findMany({
      where: {
        ...(status ? { status: status as import("@prisma/client").DemandStatus } : {}),
        ...(category ? { category: category as import("@prisma/client").DemandCategory } : {}),
        ...(search
          ? {
              OR: [
                { protocol: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(demands);
  } catch (err) {
    console.error("[GET /api/demandas]", err);
    return NextResponse.json(
      { error: "Erro ao buscar demandas." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

Saída esperada: nenhum erro.

- [ ] **Step 3: Testar o endpoint manualmente**

Iniciar o servidor:
```bash
npm run dev
```

Em outro terminal, enviar uma requisição de teste:
```bash
curl -X POST http://localhost:3000/api/demandas \
  -H "Content-Type: application/json" \
  -d '{"requesterName":"Maria da Silva","unit":"Apto 302","phone":"11987654321","category":"VAZAMENTO","title":"Infiltração no teto","description":"Há uma mancha de umidade no teto do corredor do 3o andar."}'
```

Saída esperada (201):
```json
{"protocol":"RST-2026-XXXXXX","accessCode":"YYYYYY"}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/demandas/route.ts
git commit -m "feat(api): POST /api/demandas — criar demanda pública com protocolo e código de acesso"
```

---

## Task 5: POST /api/demandas/lookup — Consulta pública com rate limit

**Files:**
- Create: `app/api/demandas/lookup/route.ts`

- [ ] **Step 1: Criar endpoint de consulta pública**

Criar `app/api/demandas/lookup/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyAccessCode, checkRateLimit, getClientIp } from "@/lib/demandas";

const LookupSchema = z.object({
  protocol: z.string().min(1),
  accessCode: z.string().min(1),
});

const INVALID_MSG = "Protocolo ou código inválido. Verifique os dados e tente novamente.";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 1 minuto e tente novamente." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { protocol, accessCode } = LookupSchema.parse(body);

    const demand = await prisma.demand.findUnique({
      where: { protocol: protocol.toUpperCase() },
      include: {
        updates: {
          orderBy: { createdAt: "asc" },
          select: {
            previousStatus: true,
            newStatus: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });

    if (!demand) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 404 });
    }

    const valid = await verifyAccessCode(accessCode, demand.accessCode);
    if (!valid) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 401 });
    }

    // Retornar apenas dados não-pessoais
    return NextResponse.json({
      protocol: demand.protocol,
      status: demand.status,
      category: demand.category,
      title: demand.title,
      description: demand.description,
      attachmentUrl: demand.attachmentUrl,
      attachmentName: demand.attachmentName,
      createdAt: demand.createdAt,
      closedAt: demand.closedAt,
      updates: demand.updates,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
    }
    console.error("[POST /api/demandas/lookup]", err);
    return NextResponse.json({ error: INVALID_MSG }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Testar o lookup manualmente**

Usar o protocolo e código retornados no Task 4 Step 3:
```bash
curl -X POST http://localhost:3000/api/demandas/lookup \
  -H "Content-Type: application/json" \
  -d '{"protocol":"RST-2026-XXXXXX","accessCode":"YYYYYY"}'
```

Saída esperada (200): objeto com status, category, title, description, updates. Sem name/unit/phone/email.

Testar com código errado:
```bash
curl -X POST http://localhost:3000/api/demandas/lookup \
  -H "Content-Type: application/json" \
  -d '{"protocol":"RST-2026-XXXXXX","accessCode":"ERRADO"}'
```

Saída esperada (401): `{"error":"Protocolo ou código inválido..."}`

- [ ] **Step 4: Commit**

```bash
git add app/api/demandas/lookup/route.ts
git commit -m "feat(api): POST /api/demandas/lookup — consulta pública com rate limit e bcrypt"
```

---

## Task 6: GET + PUT /api/demandas/[id] — Detalhe e atualização admin

**Files:**
- Create: `app/api/demandas/[id]/route.ts`

- [ ] **Step 1: Criar endpoint admin de detalhe e atualização**

Criar `app/api/demandas/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeText } from "@/lib/demandas";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        updates: {
          orderBy: { createdAt: "asc" },
          include: { createdBy: { select: { name: true, role: true } } },
        },
      },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }

    return NextResponse.json(demand);
  } catch (err) {
    console.error("[GET /api/demandas/[id]]", err);
    return NextResponse.json({ error: "Erro ao buscar demanda." }, { status: 500 });
  }
}

const UpdateDemandSchema = z.object({
  newStatus: z.enum([
    "RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ENCERRADA_SEM_ACAO",
  ]),
  message: z.string().min(3, "Escreva uma mensagem de atualização").max(1000),
});

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { newStatus, message } = UpdateDemandSchema.parse(body);

    const demand = await prisma.demand.findUnique({ where: { id } });
    if (!demand) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }

    const isFinalStatus =
      newStatus === "RESOLVIDA" || newStatus === "ENCERRADA_SEM_ACAO";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.demandUpdate.create({
        data: {
          demandId: id,
          previousStatus: demand.status,
          newStatus,
          message: sanitizeText(message),
          createdById: session.user.id,
        },
      });

      return tx.demand.update({
        where: { id },
        data: {
          status: newStatus,
          closedAt: isFinalStatus ? new Date() : undefined,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[PUT /api/demandas/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar demanda." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/demandas/[id]/route.ts
git commit -m "feat(api): GET + PUT /api/demandas/[id] — detalhe e atualização admin"
```

---

## Task 7: POST /api/demandas/[id]/encerrar — Encerramento com status explícito

**Files:**
- Create: `app/api/demandas/[id]/encerrar/route.ts`

- [ ] **Step 1: Criar endpoint de encerramento**

Criar `app/api/demandas/[id]/encerrar/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeText } from "@/lib/demandas";

interface Params {
  params: Promise<{ id: string }>;
}

const EncerrarSchema = z.object({
  finalStatus: z.enum(["RESOLVIDA", "ENCERRADA_SEM_ACAO"]),
  message: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { finalStatus, message } = EncerrarSchema.parse(body);

    const demand = await prisma.demand.findUnique({ where: { id } });
    if (!demand) {
      return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });
    }

    if (demand.status === "RESOLVIDA" || demand.status === "ENCERRADA_SEM_ACAO") {
      return NextResponse.json(
        { error: "Esta demanda já está encerrada." },
        { status: 409 }
      );
    }

    const encerrarMsg =
      finalStatus === "RESOLVIDA"
        ? "Demanda encerrada como resolvida."
        : "Demanda encerrada sem ação.";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.demandUpdate.create({
        data: {
          demandId: id,
          previousStatus: demand.status,
          newStatus: finalStatus,
          message: message ? sanitizeText(message) : encerrarMsg,
          createdById: session.user.id,
        },
      });

      return tx.demand.update({
        where: { id },
        data: { status: finalStatus, closedAt: new Date() },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/demandas/[id]/encerrar]", err);
    return NextResponse.json({ error: "Erro ao encerrar demanda." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/demandas/[id]/encerrar/route.ts
git commit -m "feat(api): POST /api/demandas/[id]/encerrar — encerramento com finalStatus explícito"
```

---

## Task 8: Página hub pública /demandas

**Files:**
- Create: `app/(public)/demandas/page.tsx`

- [ ] **Step 1: Criar a página hub**

Criar `app/(public)/demandas/page.tsx`:

```typescript
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Demandas",
  description:
    "Abra uma solicitação formal ou acompanhe o andamento de uma demanda no Condomínio Residencial Santíssima Trindade.",
};

export default function DemandasHubPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3">Central de Demandas</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Registre uma solicitação ou acompanhe o andamento de uma demanda
          junto à gestão do condomínio.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/demandas/nova"
          className="flex items-center gap-4 w-full bg-primary text-white rounded-xl px-6 py-5 font-bold text-lg hover:bg-primary/90 transition-colors"
          style={{ minHeight: "72px" }}
        >
          <ClipboardList className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <div className="text-left">
            <div>Abrir Nova Demanda</div>
            <div className="text-sm font-normal text-white/80 mt-0.5">
              Manutenção, reclamação, sugestão e mais
            </div>
          </div>
        </Link>

        <Link
          href="/demandas/acompanhar"
          className="flex items-center gap-4 w-full bg-white border-2 border-primary text-primary rounded-xl px-6 py-5 font-bold text-lg hover:bg-primary/5 transition-colors"
          style={{ minHeight: "72px" }}
        >
          <Search className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
          <div className="text-left">
            <div>Acompanhar Demanda</div>
            <div className="text-sm font-normal text-muted-foreground mt-0.5">
              Consulte pelo protocolo e código de acesso
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800 leading-relaxed">
        <strong>ℹ️ Como funciona?</strong>
        <p className="mt-2">
          Ao abrir uma demanda, você receberá um <strong>número de protocolo</strong> e
          um <strong>código de acesso</strong>. Guarde essas informações para
          acompanhar o andamento da sua solicitação.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Testar no browser**

Acessar `http://localhost:3000/demandas`. Verificar:
- Dois botões grandes e clicáveis
- Caixa informativa sobre protocolo/código
- Layout funcionando em mobile (reduzir janela)

- [ ] **Step 3: Commit**

```bash
git add app/(public)/demandas/page.tsx
git commit -m "feat(public): página hub Central de Demandas em /demandas"
```

---

## Task 9: NovaDemandaForm — Formulário de abertura

**Files:**
- Create: `components/public/NovaDemandaForm.tsx`

- [ ] **Step 1: Criar o componente de formulário**

Criar `components/public/NovaDemandaForm.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";

const CATEGORIAS = [
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "BARULHO", label: "Barulho" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "VAZAMENTO", label: "Vazamento" },
  { value: "SUGESTAO", label: "Sugestão" },
  { value: "RECLAMACAO", label: "Reclamação" },
  { value: "OUTROS", label: "Outros" },
];

interface DemandaSuccessData {
  protocol: string;
  accessCode: string;
}

interface NovaDemandaFormProps {
  onSuccess: (data: DemandaSuccessData) => void;
}

export default function NovaDemandaForm({ onSuccess }: NovaDemandaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Formato inválido. Use JPG, PNG ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploadingFile(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Falha no upload");
      const json = await res.json();
      setAttachmentUrl(json.url);
      setAttachmentName(file.name);
    } catch {
      setError("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploadingFile(false);
    }
  }

  function removeAttachment() {
    setAttachmentUrl(null);
    setAttachmentName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: fd.get("requesterName"),
          unit: fd.get("unit"),
          phone: fd.get("phone"),
          email: fd.get("email") || null,
          category: fd.get("category"),
          title: fd.get("title"),
          description: fd.get("description"),
          attachmentUrl,
          attachmentName,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao enviar demanda.");
        return;
      }
      onSuccess({ protocol: json.protocol, accessCode: json.accessCode });
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-danger-light border border-danger/30 text-danger rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Dados do solicitante */}
      <fieldset>
        <legend className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Seus dados
        </legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="requesterName" className="block text-sm font-medium mb-1">
              Nome completo <span className="text-danger">*</span>
            </label>
            <input
              id="requesterName"
              name="requesterName"
              type="text"
              required
              autoComplete="name"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium mb-1">
              Apartamento / Unidade <span className="text-danger">*</span>
            </label>
            <input
              id="unit"
              name="unit"
              type="text"
              required
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="Ex: Apto 204, Bloco B 101"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Telefone <span className="text-danger">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="(11) 9 8765-4321"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-mail <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="seu@email.com"
            />
          </div>
        </div>
      </fieldset>

      {/* Detalhes da demanda */}
      <fieldset>
        <legend className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Sobre a demanda
        </legend>
        <div className="space-y-3">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Categoria <span className="text-danger">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Título <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={120}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="Resumo do problema em poucas palavras"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Descrição <span className="text-danger">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              maxLength={2000}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
              placeholder="Descreva o problema com o máximo de detalhes possível: local, quando começou, frequência..."
            />
          </div>
        </div>
      </fieldset>

      {/* Anexo */}
      <fieldset>
        <legend className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Anexo <span className="text-muted-foreground font-normal normal-case">(opcional)</span>
        </legend>

        {attachmentName ? (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-primary flex-1 truncate">{attachmentName}</span>
            <button
              type="button"
              onClick={removeAttachment}
              className="text-muted-foreground hover:text-danger transition-colors"
              aria-label="Remover anexo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg px-4 py-6 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors text-center">
            <Paperclip className="w-6 h-6 text-muted-foreground mb-2" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              {uploadingFile ? "Enviando..." : "Foto ou documento"}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou PDF · máx. 10MB
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadingFile}
            />
          </label>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={loading || uploadingFile}
        className="w-full bg-primary text-white rounded-xl px-6 py-4 font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ minHeight: "56px" }}
      >
        {loading ? "Enviando..." : "Enviar Demanda"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/public/NovaDemandaForm.tsx
git commit -m "feat(component): NovaDemandaForm — formulário público de abertura de demanda"
```

---

## Task 10: DemandaSuccessView + /demandas/nova page

**Files:**
- Create: `components/public/DemandaSuccessView.tsx`
- Create: `app/(public)/demandas/nova/page.tsx`

- [ ] **Step 1: Criar componente de tela de sucesso**

Criar `components/public/DemandaSuccessView.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Check, AlertTriangle } from "lucide-react";

interface DemandaSuccessViewProps {
  protocol: string;
  accessCode: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-lg border border-current text-sm font-medium transition-colors w-full justify-center"
      style={{ minHeight: "44px" }}
      aria-label={copied ? "Copiado" : `Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" aria-hidden="true" />
          Copiado com sucesso!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" aria-hidden="true" />
          Copiar {label}
        </>
      )}
    </button>
  );
}

export default function DemandaSuccessView({
  protocol,
  accessCode,
}: DemandaSuccessViewProps) {
  return (
    <div className="space-y-5">
      {/* Ícone e título */}
      <div className="text-center">
        <CheckCircle2
          className="w-16 h-16 text-success mx-auto mb-3"
          aria-hidden="true"
        />
        <h2 className="text-2xl font-bold text-foreground">
          Demanda registrada!
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Guarde os dados abaixo para acompanhar o andamento da sua solicitação.
        </p>
      </div>

      {/* Protocolo */}
      <div className="bg-green-50 border-2 border-success rounded-xl p-5 text-success-foreground">
        <div className="text-xs font-bold uppercase tracking-wide text-success mb-1">
          📋 Número do Protocolo
        </div>
        <div
          className="text-2xl font-black tracking-wider text-green-800 font-mono"
          aria-label={`Protocolo ${protocol}`}
        >
          {protocol}
        </div>
        <div className="text-success">
          <CopyButton text={protocol} label="protocolo" />
        </div>
      </div>

      {/* Código de acesso */}
      <div className="bg-amber-50 border-2 border-warning rounded-xl p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">
          🔑 Código de Acesso
        </div>
        <div
          className="text-2xl font-black tracking-[0.3em] text-amber-900 font-mono"
          aria-label={`Código de acesso ${accessCode}`}
        >
          {accessCode}
        </div>
        <div className="text-amber-700">
          <CopyButton text={accessCode} label="código" />
        </div>
      </div>

      {/* Aviso de código único */}
      <div className="bg-amber-50 border-2 border-warning rounded-xl p-5 flex gap-3">
        <AlertTriangle
          className="w-6 h-6 text-warning flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold text-amber-900 text-base">
            Este código será exibido apenas agora.
          </p>
          <p className="text-amber-800 mt-1 leading-relaxed">
            Guarde-o em local seguro. Sem o código de acesso, não será possível
            acompanhar sua demanda. Em caso de perda, entre em contato com a
            gestão/síndico.
          </p>
        </div>
      </div>

      {/* Reforço do aviso abaixo dos botões de copiar */}
      <p className="text-center text-sm text-muted-foreground">
        ⚠️ <strong>Lembre-se:</strong> o código de acesso não poderá ser
        recuperado depois que você sair desta tela.
      </p>

      {/* CTA */}
      <Link
        href={`/demandas/acompanhar?protocol=${encodeURIComponent(protocol)}`}
        className="flex items-center justify-center gap-2 w-full border-2 border-primary text-primary rounded-xl px-6 py-4 font-bold text-base hover:bg-primary/5 transition-colors"
        style={{ minHeight: "56px" }}
      >
        Acompanhar esta demanda
      </Link>

      <Link
        href="/demandas"
        className="flex items-center justify-center w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
      >
        Voltar para a Central de Demandas
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Criar a página /demandas/nova**

Criar `app/(public)/demandas/nova/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NovaDemandaForm from "@/components/public/NovaDemandaForm";
import DemandaSuccessView from "@/components/public/DemandaSuccessView";

interface SuccessData {
  protocol: string;
  accessCode: string;
}

export default function NovaDemandaPage() {
  const [success, setSuccess] = useState<SuccessData | null>(null);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {success ? (
        <DemandaSuccessView
          protocol={success.protocol}
          accessCode={success.accessCode}
        />
      ) : (
        <>
          <div className="mb-6">
            <Link
              href="/demandas"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              style={{ minHeight: "auto" }}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold">Abrir Nova Demanda</h1>
            <p className="text-muted-foreground mt-1">
              Campos marcados com <span className="text-danger">*</span> são obrigatórios.
            </p>
          </div>

          <NovaDemandaForm onSuccess={setSuccess} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Testar o fluxo completo no browser**

Acessar `http://localhost:3000/demandas/nova`. Verificar:
- Formulário renderiza corretamente em mobile
- Enviar demanda de teste → tela de sucesso aparece com protocolo e código
- Botões "Copiar protocolo" e "Copiar código" funcionam com feedback "Copiado com sucesso!"
- Aviso em caixa âmbar está bem visível
- Link "Acompanhar esta demanda" redireciona com o protocolo na URL

- [ ] **Step 4: Commit**

```bash
git add components/public/DemandaSuccessView.tsx app/(public)/demandas/nova/page.tsx
git commit -m "feat(public): tela de sucesso com protocolo/código e página /demandas/nova"
```

---

## Task 11: AcompanharDemandaForm + página /demandas/acompanhar

**Files:**
- Create: `components/public/AcompanharDemandaForm.tsx`
- Create: `app/(public)/demandas/acompanhar/page.tsx`

- [ ] **Step 1: Criar o componente de consulta**

Criar `components/public/AcompanharDemandaForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface AcompanharDemandaFormProps {
  defaultProtocol?: string;
}

export default function AcompanharDemandaForm({
  defaultProtocol = "",
}: AcompanharDemandaFormProps) {
  const router = useRouter();
  const [protocol, setProtocol] = useState(defaultProtocol);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/demandas/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: protocol.trim().toUpperCase(),
          accessCode: accessCode.trim().toUpperCase(),
        }),
      });

      if (res.status === 429) {
        setError("Muitas tentativas. Aguarde 1 minuto e tente novamente.");
        return;
      }

      if (!res.ok) {
        setError("Protocolo ou código inválido. Verifique os dados e tente novamente.");
        return;
      }

      // Redirecionar para a página de detalhe com os dados em sessionStorage
      const data = await res.json();
      sessionStorage.setItem(`demand-${protocol.trim().toUpperCase()}`, JSON.stringify(data));
      router.push(`/demandas/acompanhar/${encodeURIComponent(protocol.trim().toUpperCase())}`);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-danger-light border border-danger/30 text-danger rounded-lg p-4 text-sm" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="protocol" className="block text-sm font-bold mb-1">
          Número do Protocolo <span className="text-danger">*</span>
        </label>
        <input
          id="protocol"
          type="text"
          required
          value={protocol}
          onChange={(e) => setProtocol(e.target.value.toUpperCase())}
          className="w-full border-2 border-border rounded-xl px-4 py-4 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary bg-background uppercase"
          placeholder="Ex: RST-2026-K7M9Q2"
          style={{ minHeight: "56px" }}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          O protocolo começa com RST- seguido do ano e um código.
        </p>
      </div>

      <div>
        <label htmlFor="accessCode" className="block text-sm font-bold mb-1">
          Código de Acesso <span className="text-danger">*</span>
        </label>
        <input
          id="accessCode"
          type="text"
          required
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          className="w-full border-2 border-border rounded-xl px-4 py-4 text-base font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary bg-background uppercase"
          placeholder="Ex: X7K9P2"
          maxLength={8}
          style={{ minHeight: "56px" }}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Não diferencia maiúsculas e minúsculas.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white rounded-xl px-6 py-4 font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60"
        style={{ minHeight: "56px" }}
      >
        {loading ? "Consultando..." : (
          <span className="flex items-center justify-center gap-2">
            <Search className="w-5 h-5" aria-hidden="true" />
            Consultar Demanda
          </span>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Não encontrou? Verifique se o protocolo está correto ou{" "}
        <strong>entre em contato com a gestão/síndico</strong>.
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Criar a página de consulta**

Criar `app/(public)/demandas/acompanhar/page.tsx`:

```typescript
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AcompanharDemandaForm from "@/components/public/AcompanharDemandaForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acompanhar Demanda — Central de Demandas",
};

interface Props {
  searchParams: Promise<{ protocol?: string }>;
}

export default async function AcompanharPage({ searchParams }: Props) {
  const { protocol } = await searchParams;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          href="/demandas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          style={{ minHeight: "auto" }}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold">Acompanhar Demanda</h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Informe o protocolo e o código de acesso que você recebeu ao abrir
          a demanda.
        </p>
      </div>

      <AcompanharDemandaForm defaultProtocol={protocol ?? ""} />
    </div>
  );
}
```

- [ ] **Step 3: Testar no browser**

Acessar `http://localhost:3000/demandas/acompanhar`. Verificar:
- Campos grandes, bem legíveis
- Placeholder mostra formato `RST-2026-K7M9Q2`
- Input converte para maiúsculas automaticamente
- Mensagem de erro genérica ao digitar código errado

- [ ] **Step 4: Commit**

```bash
git add components/public/AcompanharDemandaForm.tsx app/(public)/demandas/acompanhar/page.tsx
git commit -m "feat(public): formulário de consulta e página /demandas/acompanhar"
```

---

## Task 12: DemandaDetalhePublico + /demandas/acompanhar/[protocol]

**Files:**
- Create: `components/public/DemandaDetalhePublico.tsx`
- Create: `app/(public)/demandas/acompanhar/[protocol]/page.tsx`

- [ ] **Step 1: Definir tipos para os dados da demanda pública**

No início de `components/public/DemandaDetalhePublico.tsx`, definir os tipos inline (sem importar de Prisma para não expor tipos internos):

```typescript
"use client";

import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";
import { formatarDataExtenso, formatarDataHoraAmigavel } from "@/lib/utils";

type DemandStatusPublic =
  | "RECEBIDA"
  | "EM_ANALISE"
  | "EM_ANDAMENTO"
  | "RESOLVIDA"
  | "ENCERRADA_SEM_ACAO";

type DemandCategoryPublic =
  | "MANUTENCAO" | "SEGURANCA" | "LIMPEZA" | "FINANCEIRO" | "BARULHO"
  | "ILUMINACAO" | "VAZAMENTO" | "SUGESTAO" | "RECLAMACAO" | "OUTROS";

interface DemandUpdatePublic {
  previousStatus: DemandStatusPublic | null;
  newStatus: DemandStatusPublic;
  message: string | null;
  createdAt: string;
}

interface DemandaPublicData {
  protocol: string;
  status: DemandStatusPublic;
  category: DemandCategoryPublic;
  title: string;
  description: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  closedAt: string | null;
  updates: DemandUpdatePublic[];
}

const STATUS_LABEL: Record<DemandStatusPublic, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ENCERRADA_SEM_ACAO: "Encerrada sem ação",
};

const STATUS_CLASS: Record<DemandStatusPublic, string> = {
  RECEBIDA: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-yellow-100 text-yellow-800",
  EM_ANDAMENTO: "bg-purple-100 text-purple-800",
  RESOLVIDA: "bg-green-100 text-green-800",
  ENCERRADA_SEM_ACAO: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABEL: Record<DemandCategoryPublic, string> = {
  MANUTENCAO: "Manutenção", SEGURANCA: "Segurança", LIMPEZA: "Limpeza",
  FINANCEIRO: "Financeiro", BARULHO: "Barulho", ILUMINACAO: "Iluminação",
  VAZAMENTO: "Vazamento", SUGESTAO: "Sugestão", RECLAMACAO: "Reclamação",
  OUTROS: "Outros",
};

function historyLabel(update: DemandUpdatePublic): string {
  if (!update.previousStatus) return "Demanda registrada";
  return STATUS_LABEL[update.newStatus];
}

interface Props {
  data: DemandaPublicData;
  protocol: string;
}

export default function DemandaDetalhePublico({ data, protocol }: Props) {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/demandas/acompanhar"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        style={{ minHeight: "auto" }}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Nova consulta
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CLASS[data.status]}`}
          >
            {STATUS_LABEL[data.status]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {CATEGORY_LABEL[data.category]}
          </span>
        </div>
        <h1 className="text-xl font-bold leading-snug">{data.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Protocolo:{" "}
          <span className="font-mono font-bold text-primary">{protocol}</span>
          {" · "}
          Aberta em {formatarDataExtenso(data.createdAt)}
        </p>
      </div>

      {/* Descrição */}
      <div className="bg-muted/50 rounded-xl p-5 mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          Descrição
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {data.description}
        </p>
      </div>

      {/* Anexo */}
      {data.attachmentUrl && (
        <a
          href={data.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-primary hover:bg-blue-100 transition-colors"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">
            {data.attachmentName ?? "Ver anexo"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            ↗ abrir
          </span>
        </a>
      )}

      {/* Histórico */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
          Histórico de andamento
        </h2>

        <div className="space-y-3">
          {data.updates.map((update, i) => (
            <div
              key={i}
              className="border-l-2 border-primary/30 pl-4 py-1"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-bold text-foreground">
                  {historyLabel(update)}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatarDataHoraAmigavel(update.createdAt)}
                </span>
              </div>
              {update.message && (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2 mt-1">
                  {update.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nota de privacidade */}
      <div className="mt-8 bg-muted rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        🔒 Por questões de privacidade e segurança, informações pessoais do
        solicitante não são exibidas nesta consulta.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar a página de detalhe público**

Criar `app/(public)/demandas/acompanhar/[protocol]/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DemandaDetalhePublico from "@/components/public/DemandaDetalhePublico";
import Link from "next/link";

export default function DemandaDetalhePublicoPage() {
  const { protocol } = useParams<{ protocol: string }>();
  const router = useRouter();
  const [data, setData] = useState<object | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const key = `demand-${decodeURIComponent(protocol)}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [protocol]);

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">
          Sessão expirada ou protocolo não encontrado.
        </p>
        <Link
          href="/demandas/acompanhar"
          className="inline-flex items-center justify-center bg-primary text-white rounded-xl px-6 py-3 font-bold hover:bg-primary/90 transition-colors"
        >
          Consultar novamente
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <DemandaDetalhePublico
      data={data as Parameters<typeof DemandaDetalhePublico>[0]["data"]}
      protocol={decodeURIComponent(protocol)}
    />
  );
}
```

- [ ] **Step 3: Testar o fluxo completo**

1. Abrir nova demanda em `/demandas/nova`
2. Copiar protocolo e código de acesso da tela de sucesso
3. Clicar em "Acompanhar esta demanda"
4. Verificar que a página de detalhe carrega com status, descrição e histórico
5. Confirmar que **nenhum dado pessoal** (nome, telefone, unidade) aparece

- [ ] **Step 4: Commit**

```bash
git add components/public/DemandaDetalhePublico.tsx app/(public)/demandas/acompanhar/[protocol]/page.tsx
git commit -m "feat(public): DemandaDetalhePublico e página /demandas/acompanhar/[protocol]"
```

---

## Task 13: Admin — Lista /admin/demandas com filtros

**Files:**
- Create: `components/admin/DemandaFiltros.tsx`
- Create: `app/admin/demandas/page.tsx`

- [ ] **Step 1: Criar componente de filtros (client)**

Criar `components/admin/DemandaFiltros.tsx`:

```typescript
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDA", label: "Resolvida" },
  { value: "ENCERRADA_SEM_ACAO", label: "Encerrada sem ação" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas as categorias" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "BARULHO", label: "Barulho" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "VAZAMENTO", label: "Vazamento" },
  { value: "SUGESTAO", label: "Sugestão" },
  { value: "RECLAMACAO", label: "Reclamação" },
  { value: "OUTROS", label: "Outros" },
];

export default function DemandaFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Busca */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar por protocolo ou título..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        />
      </div>

      {/* Status */}
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Categoria */}
      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
      >
        {CATEGORY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Criar a página de lista admin**

Criar `app/admin/demandas/page.tsx`:

```typescript
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData } from "@/lib/utils";
import DemandaFiltros from "@/components/admin/DemandaFiltros";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { DemandStatus, DemandCategory } from "@prisma/client";

export const metadata: Metadata = { title: "Central de Demandas" };

const STATUS_LABEL: Record<DemandStatus, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ENCERRADA_SEM_ACAO: "Encerrada sem ação",
};

const STATUS_CLASS: Record<DemandStatus, string> = {
  RECEBIDA: "bg-blue-100 text-blue-700",
  EM_ANALISE: "bg-yellow-100 text-yellow-700",
  EM_ANDAMENTO: "bg-purple-100 text-purple-700",
  RESOLVIDA: "bg-success-light text-green-700",
  ENCERRADA_SEM_ACAO: "bg-muted text-muted-foreground",
};

const CATEGORY_LABEL: Record<DemandCategory, string> = {
  MANUTENCAO: "Manutenção", SEGURANCA: "Segurança", LIMPEZA: "Limpeza",
  FINANCEIRO: "Financeiro", BARULHO: "Barulho", ILUMINACAO: "Iluminação",
  VAZAMENTO: "Vazamento", SUGESTAO: "Sugestão", RECLAMACAO: "Reclamação",
  OUTROS: "Outros",
};

interface Props {
  searchParams: Promise<{
    status?: string;
    category?: string;
    search?: string;
  }>;
}

export default async function AdminDemandasPage({ searchParams }: Props) {
  const { status, category, search } = await searchParams;

  const demands = await prisma.demand.findMany({
    where: {
      ...(status ? { status: status as DemandStatus } : {}),
      ...(category ? { category: category as DemandCategory } : {}),
      ...(search
        ? {
            OR: [
              { protocol: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const abertas = demands.filter(
    (d) => d.status !== "RESOLVIDA" && d.status !== "ENCERRADA_SEM_ACAO"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Central de Demandas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {demands.length} demanda{demands.length !== 1 ? "s" : ""} ·{" "}
            {abertas} em aberto
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <DemandaFiltros />
      </Suspense>

      {demands.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted-foreground">
            {search || status || category
              ? "Nenhuma demanda encontrada com esses filtros."
              : "Nenhuma demanda recebida ainda."}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Protocolo
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Unidade
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Título
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Categoria
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Aberta em
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => (
                <tr
                  key={demand.id}
                  className="border-b border-border/50 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary text-xs">
                      {demand.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {demand.unit}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-1 font-medium">{demand.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {CATEGORY_LABEL[demand.category]}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                    {formatarData(demand.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_CLASS[demand.status]}`}
                    >
                      {STATUS_LABEL[demand.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/demandas/${demand.id}`}
                      className="btn-secondary py-1.5 px-3 text-xs min-h-[auto]"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Testar no browser**

Acessar `http://localhost:3000/admin/demandas` (autenticado). Verificar:
- Lista mostra demandas criadas nos testes anteriores
- Protocolo em fonte monospace
- Filtros de status e categoria funcionam (atualizam URL e refiltram)
- Busca por protocolo funciona

- [ ] **Step 4: Commit**

```bash
git add components/admin/DemandaFiltros.tsx app/admin/demandas/page.tsx
git commit -m "feat(admin): lista de demandas com filtros por status, categoria e busca"
```

---

## Task 14: DemandaAtualizarForm + DemandaEncerrarModal

**Files:**
- Create: `components/admin/DemandaAtualizarForm.tsx`
- Create: `components/admin/DemandaEncerrarModal.tsx`

- [ ] **Step 1: Criar formulário unificado de atualização**

Criar `components/admin/DemandaAtualizarForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DemandStatus =
  | "RECEBIDA" | "EM_ANALISE" | "EM_ANDAMENTO" | "RESOLVIDA" | "ENCERRADA_SEM_ACAO";

const STATUS_OPTIONS: { value: DemandStatus; label: string }[] = [
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDA", label: "Resolvida" },
  { value: "ENCERRADA_SEM_ACAO", label: "Encerrada sem ação" },
];

interface DemandaAtualizarFormProps {
  demandId: string;
  currentStatus: DemandStatus;
}

export default function DemandaAtualizarForm({
  demandId,
  currentStatus,
}: DemandaAtualizarFormProps) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<DemandStatus>(currentStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/demandas/${demandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, message }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao atualizar demanda.");
        return;
      }

      setSuccess(true);
      setMessage("");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger-light border border-danger/30 text-danger rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success-light border border-success/30 text-green-700 rounded-lg p-3 text-sm">
          Demanda atualizada com sucesso.
        </div>
      )}

      <div>
        <label htmlFor="newStatus" className="block text-sm font-medium mb-1">
          Novo status
        </label>
        <select
          id="newStatus"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as DemandStatus)}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Mensagem para o morador{" "}
          <span className="text-danger">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          maxLength={1000}
          placeholder="Descreva o andamento para o morador..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Esta mensagem aparecerá no histórico público da demanda.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white rounded-lg px-4 py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
        style={{ minHeight: "44px" }}
      >
        {loading ? "Salvando..." : "Salvar atualização"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Criar modal de encerramento**

Criar `components/admin/DemandaEncerrarModal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface DemandaEncerrarModalProps {
  demandId: string;
}

export default function DemandaEncerrarModal({
  demandId,
}: DemandaEncerrarModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"RESOLVIDA" | "ENCERRADA_SEM_ACAO">("RESOLVIDA");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEncerrar() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/demandas/${demandId}/encerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalStatus, message: message || null }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao encerrar demanda.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="w-full border border-border text-muted-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
          style={{ minHeight: "44px" }}
        >
          Encerrar demanda
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" aria-hidden="true" />
              <Dialog.Title className="font-bold text-base">
                Encerrar demanda
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Esta ação finalizará a demanda e registrará o encerramento no
            histórico. Escolha o status final e, se desejar, adicione uma
            mensagem.
          </p>

          {error && (
            <div className="bg-danger-light text-danger rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Status final <span className="text-danger">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="finalStatus"
                    value="RESOLVIDA"
                    checked={finalStatus === "RESOLVIDA"}
                    onChange={() => setFinalStatus("RESOLVIDA")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">Resolvida</div>
                    <div className="text-xs text-muted-foreground">
                      O problema foi tratado e solucionado.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="finalStatus"
                    value="ENCERRADA_SEM_ACAO"
                    checked={finalStatus === "ENCERRADA_SEM_ACAO"}
                    onChange={() => setFinalStatus("ENCERRADA_SEM_ACAO")}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">Encerrada sem ação</div>
                    <div className="text-xs text-muted-foreground">
                      Demanda duplicada, fora de escopo ou não será atendida.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="encerrarMsg" className="block text-sm font-medium mb-1">
                Mensagem final{" "}
                <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <textarea
                id="encerrarMsg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Explicação adicional para o morador..."
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              onClick={handleEncerrar}
              disabled={loading}
              className="flex-1 bg-danger text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-danger/90 transition-colors disabled:opacity-60"
            >
              {loading ? "Encerrando..." : "Confirmar encerramento"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/DemandaAtualizarForm.tsx components/admin/DemandaEncerrarModal.tsx
git commit -m "feat(admin): DemandaAtualizarForm e DemandaEncerrarModal com confirmação"
```

---

## Task 15: Admin — Detalhe /admin/demandas/[id]

**Files:**
- Create: `app/admin/demandas/[id]/page.tsx`

- [ ] **Step 1: Criar a página de detalhe admin**

Criar `app/admin/demandas/[id]/page.tsx`:

```typescript
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Paperclip } from "lucide-react";
import { formatarData, formatarDataExtenso, formatarDataHoraAmigavel } from "@/lib/utils";
import DemandaAtualizarForm from "@/components/admin/DemandaAtualizarForm";
import DemandaEncerrarModal from "@/components/admin/DemandaEncerrarModal";
import type { Metadata } from "next";
import type { DemandStatus, DemandCategory } from "@prisma/client";

export const metadata: Metadata = { title: "Detalhe da Demanda" };

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<DemandStatus, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ENCERRADA_SEM_ACAO: "Encerrada sem ação",
};

const STATUS_CLASS: Record<DemandStatus, string> = {
  RECEBIDA: "bg-blue-100 text-blue-700",
  EM_ANALISE: "bg-yellow-100 text-yellow-700",
  EM_ANDAMENTO: "bg-purple-100 text-purple-700",
  RESOLVIDA: "bg-success-light text-green-700",
  ENCERRADA_SEM_ACAO: "bg-muted text-muted-foreground",
};

const CATEGORY_LABEL: Record<DemandCategory, string> = {
  MANUTENCAO: "Manutenção", SEGURANCA: "Segurança", LIMPEZA: "Limpeza",
  FINANCEIRO: "Financeiro", BARULHO: "Barulho", ILUMINACAO: "Iluminação",
  VAZAMENTO: "Vazamento", SUGESTAO: "Sugestão", RECLAMACAO: "Reclamação",
  OUTROS: "Outros",
};

const isEncerrada = (status: DemandStatus) =>
  status === "RESOLVIDA" || status === "ENCERRADA_SEM_ACAO";

export default async function AdminDemandaDetailPage({ params }: Props) {
  const { id } = await params;

  const demand = await prisma.demand.findUnique({
    where: { id },
    include: {
      updates: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true, role: true } } },
      },
    },
  });

  if (!demand) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/demandas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[auto]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para demandas
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CLASS[demand.status]}`}>
            {STATUS_LABEL[demand.status]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {CATEGORY_LABEL[demand.category]}
          </span>
        </div>

        <h1 className="text-xl font-bold">{demand.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-mono font-bold text-primary">{demand.protocol}</span>
          {" · "}
          Aberta em {formatarDataExtenso(demand.createdAt)}
          {demand.closedAt && (
            <> · Encerrada em {formatarData(demand.closedAt)}</>
          )}
        </p>
      </div>

      {/* Dados pessoais — restrito */}
      <div className="bg-amber-50 border-2 border-warning rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-amber-700" aria-hidden="true" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
            Informações restritas à gestão do condomínio
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">Nome</p>
            <p className="font-semibold text-amber-900">{demand.requesterName}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">Unidade</p>
            <p className="font-semibold text-amber-900">{demand.unit}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">Telefone</p>
            <p className="font-semibold text-amber-900">{demand.phone}</p>
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-0.5">E-mail</p>
            <p className="font-semibold text-amber-900">
              {demand.email ?? <span className="text-amber-500 italic">Não informado</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
          Descrição
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {demand.description}
        </p>
      </div>

      {/* Anexo */}
      {demand.attachmentUrl && (
        <a
          href={demand.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-primary hover:bg-blue-100 transition-colors"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">
            {demand.attachmentName ?? "Ver anexo"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">↗ abrir</span>
        </a>
      )}

      {/* Atualizar status + mensagem (apenas para demandas não encerradas) */}
      {!isEncerrada(demand.status) && (
        <div className="card">
          <h2 className="font-semibold mb-4">Atualizar demanda</h2>
          <DemandaAtualizarForm
            demandId={demand.id}
            currentStatus={demand.status}
          />
          <div className="mt-3 pt-3 border-t border-border">
            <DemandaEncerrarModal demandId={demand.id} />
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="card">
        <h2 className="font-semibold mb-4">Histórico</h2>
        <div className="space-y-3">
          {demand.updates.map((update) => (
            <div
              key={update.id}
              className="border-l-2 border-primary/30 pl-4 py-1"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-bold">
                  {update.previousStatus
                    ? `${STATUS_LABEL[update.previousStatus]} → ${STATUS_LABEL[update.newStatus]}`
                    : STATUS_LABEL[update.newStatus]}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatarDataHoraAmigavel(update.createdAt)}
                </span>
              </div>
              {update.message && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {update.message}
                </p>
              )}
              {update.createdBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  por {update.createdBy.name} ({update.createdBy.role})
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Testar no browser**

1. Acessar `/admin/demandas` → clicar em "Ver detalhes" em uma demanda
2. Verificar:
   - Caixa amarela com dados pessoais separada e bem visível
   - Formulário de atualização com select de status + textarea
   - Botão "Encerrar demanda" abre modal de confirmação
   - Modal tem radio buttons para RESOLVIDA / ENCERRADA_SEM_ACAO
   - Após salvar atualização, página recarrega com novo status e histórico
3. Encerrar uma demanda e verificar que o formulário some e histórico é atualizado

- [ ] **Step 3: Commit**

```bash
git add app/admin/demandas/[id]/page.tsx
git commit -m "feat(admin): página de detalhe /admin/demandas/[id] com atualização e encerramento"
```

---

## Task 16: Navegação — Navbar pública + AdminNav

**Files:**
- Modify: `components/public/Navbar.tsx`
- Modify: `components/admin/AdminNav.tsx`

- [ ] **Step 1: Adicionar "Central de Demandas" na Navbar pública**

Em `components/public/Navbar.tsx`, localizar o array `links` e adicionar o item de demandas:

```typescript
const links = [
  { href: "/financeiro", label: "Receitas e Despesas" },
  { href: "/metricas", label: "Métricas" },
  { href: "/parecer", label: "Parecer" },
  { href: "/avisos", label: "Avisos" },
  { href: "/gestao", label: "Gestão" },
  { href: "/demandas", label: "Central de Demandas" },
  { href: "/quem-somos", label: "Quem Somos" },
];
```

- [ ] **Step 2: Adicionar "Demandas" no AdminNav**

Em `components/admin/AdminNav.tsx`:

1. Adicionar import do ícone (junto aos outros imports de lucide-react):
```typescript
import { ClipboardList } from "lucide-react";
```

2. No array `links`, adicionar após o item de Propostas:
```typescript
{ href: "/admin/propostas", icone: MessageSquare, label: "Propostas" },
{ href: "/admin/demandas", icone: ClipboardList, label: "Demandas" },
{ href: "/admin/enquetes", icone: BarChart2, label: "Enquetes" },
```

- [ ] **Step 3: Testar no browser**

1. Verificar que "Central de Demandas" aparece no menu público (desktop e mobile)
2. Verificar que "Demandas" aparece no sidebar admin com ícone correto
3. Verificar que o link ativo é destacado ao navegar para `/demandas` e `/admin/demandas`

- [ ] **Step 4: Commit**

```bash
git add components/public/Navbar.tsx components/admin/AdminNav.tsx
git commit -m "feat(nav): adicionar Central de Demandas na navbar pública e AdminNav"
```

---

## Task 17: Andrade Systems — Branding em 5 locais

**Files:**
- Modify: `components/public/Footer.tsx`
- Modify: `app/layout.tsx`
- Modify: `package.json`

- [ ] **Step 1: Adicionar assinatura no Footer público**

Em `components/public/Footer.tsx`, localizar a div com o copyright e adicionar a linha da Andrade Systems:

```typescript
export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
            <span>
              Condomínio Residencial Santíssima Trindade — Portal da
              Transparência
            </span>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <div>© {ano}. Informações publicadas pelo Conselho Fiscal.</div>
            <div className="text-xs text-muted-foreground/70">
              Desenvolvido por{" "}
              <span className="font-medium text-muted-foreground">
                Andrade Systems
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Adicionar meta generator no layout raiz**

Em `app/layout.tsx`, localizar o export `metadata` e adicionar o campo `other`:

```typescript
export const metadata: Metadata = {
  // ...campos existentes...
  other: {
    generator: "Andrade Systems",
  },
};
```

Se o `metadata` não tiver campo `other`, apenas adicionar. Se não encontrar o `metadata` export, ler o arquivo antes de editar.

- [ ] **Step 3: Adicionar author no package.json**

Em `package.json`, adicionar o campo `author` após o campo `version` (ou onde fizer sentido):

```json
"author": "Andrade Systems",
```

- [ ] **Step 4: Adicionar assinatura no rodapé admin**

Em `app/admin/layout.tsx`, localizar o `<main>` e adicionar um footer após ele (dentro do `flex-1 flex flex-col`):

```typescript
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
          {children}
        </main>
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Desenvolvido por{" "}
            <span className="font-medium">Andrade Systems</span>
          </p>
        </footer>
```

- [ ] **Step 5: Verificar rodapé no browser**

Acessar `http://localhost:3000` e `http://localhost:3000/demandas`. Confirmar que o rodapé exibe "Desenvolvido por Andrade Systems" de forma discreta.

Acessar `http://localhost:3000/admin/dashboard`. Confirmar que o rodapé admin também exibe a assinatura.

- [ ] **Step 6: Commit**

```bash
git add components/public/Footer.tsx app/admin/layout.tsx app/layout.tsx package.json
git commit -m "feat: assinatura Andrade Systems no rodapé público, admin, meta e package.json"
```

---

## Task 18: Build final e verificação

**Files:** nenhum (verificação)

- [ ] **Step 1: Executar o build de produção**

```bash
npm run build
```

Saída esperada: build concluído sem erros. Verificar que não há erros de TypeScript ou compilação Next.js.

- [ ] **Step 2: Corrigir erros de build se houver**

Se houver erros de TypeScript, corrigi-los antes de prosseguir. Os erros mais comuns:
- Tipos de `DemandStatus` / `DemandCategory` não importados → adicionar `import type { DemandStatus, DemandCategory } from "@prisma/client"`
- Props faltando em algum componente → verificar a interface do componente
- `params` não aguardado → usar `await params`

- [ ] **Step 3: Executar lint**

```bash
npm run lint
```

Corrigir quaisquer erros de lint.

- [ ] **Step 4: Testar o fluxo completo de ponta a ponta**

1. **Fluxo do morador:**
   - Acessar `/demandas` → clicar "Abrir Nova Demanda"
   - Preencher formulário com todos os campos obrigatórios
   - Fazer upload de uma imagem (opcional)
   - Enviar → verificar tela de sucesso com protocolo e código bem visíveis
   - Copiar protocolo e código
   - Clicar "Acompanhar esta demanda" → chegar na tela de detalhe
   - Verificar que não há dados pessoais na tela pública

2. **Fluxo admin:**
   - Fazer login em `/admin/login`
   - Acessar `/admin/demandas` → ver a demanda criada
   - Filtrar por status "Recebida"
   - Clicar em "Ver detalhes"
   - Verificar caixa amarela com dados pessoais
   - Atualizar status para "Em análise" com mensagem
   - Verificar que histórico é atualizado
   - Encerrar demanda via modal de confirmação
   - Verificar que o formulário de atualização sumiu e histórico está completo

3. **Verificar branding:**
   - Rodapé público exibe "Desenvolvido por Andrade Systems"

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat: Central de Demandas — build verificado e fluxo completo funcionando"
```

---

## Checklist dos Critérios de Aceite

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
