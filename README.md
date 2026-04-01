# Portal da Transparência
## Condomínio Residencial Santíssima Trindade

Portal web institucional para publicação de informações financeiras e pareceres do Conselho Fiscal.

---

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Banco de dados:** PostgreSQL (Railway)
- **ORM:** Prisma 5
- **Autenticação:** NextAuth.js v5 (Credentials)
- **Estilização:** Tailwind CSS 3
- **Gráficos:** Recharts
- **Storage PDF:** Cloudinary
- **Deploy:** Railway

---

## Setup local

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Configure o banco de dados (Railway ou local)
```bash
# Cria/sincroniza as tabelas
npm run db:push

# Popula categorias e admin inicial
npm run db:seed
```

### 4. Rode em desenvolvimento
```bash
npm run dev
```

Acesse em: http://localhost:3000

---

## Variáveis de ambiente obrigatórias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para sessões (mín. 32 chars) |
| `NEXTAUTH_URL` | URL base da aplicação |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary |

### Variáveis opcionais (seed)
| Variável | Padrão |
|----------|--------|
| `SEED_ADMIN_EMAIL` | admin@condominio.com |
| `SEED_ADMIN_PASSWORD` | Mudar@123 |
| `SEED_ADMIN_NAME` | Administrador |

---

## Estrutura de rotas

### Públicas
| Rota | Página |
|------|--------|
| `/` | Home com cards de acesso rápido |
| `/financeiro` | Receitas e despesas por período |
| `/metricas` | Painel de KPIs e gráficos |
| `/parecer` | Pareceres do Conselho Fiscal |

### Administrativas (requer login)
| Rota | Página |
|------|--------|
| `/admin/login` | Login do Conselho Fiscal |
| `/admin/dashboard` | Painel com resumo |
| `/admin/lancamentos` | Lista e gestão de lançamentos |
| `/admin/lancamentos/novo` | Novo lançamento |
| `/admin/lancamentos/[id]` | Editar lançamento |
| `/admin/pareceres` | Lista e gestão de pareceres |
| `/admin/pareceres/novo` | Novo parecer |
| `/admin/pareceres/[id]` | Editar parecer |

---

## Scripts disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção
npm run lint         # Verificar ESLint
npm run db:push      # Sincronizar schema com banco
npm run db:seed      # Popular banco com dados iniciais
npm run db:studio    # Abrir Prisma Studio (GUI do banco)
```

---

## Deploy no Railway

1. Crie um novo projeto no Railway
2. Adicione um serviço PostgreSQL
3. Adicione um serviço de aplicação conectado ao repositório
4. Configure as variáveis de ambiente (copie de `.env.example`)
5. O deploy é automático a cada push

**NEXTAUTH_URL** deve ser a URL pública gerada pelo Railway.

---

## Primeiro acesso

Após o seed, acesse `/admin/login` com:
- **Email:** conforme `SEED_ADMIN_EMAIL`
- **Senha:** conforme `SEED_ADMIN_PASSWORD`

**Altere a senha após o primeiro login.**
