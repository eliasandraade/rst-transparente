-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MASTER', 'SINDICO', 'GESTAO', 'CONSELHO');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "StatusPublicacao" AS ENUM ('RASCUNHO', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "StatusObra" AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('PENDENTE', 'ANALISANDO', 'RESPONDIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "TipoEnquete" AS ENUM ('UNICA', 'MULTIPLA');

-- CreateEnum
CREATE TYPE "DemandCategory" AS ENUM ('MANUTENCAO', 'SEGURANCA', 'LIMPEZA', 'FINANCEIRO', 'BARULHO', 'ILUMINACAO', 'VAZAMENTO', 'SUGESTAO', 'RECLAMACAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "DemandStatus" AS ENUM ('RECEBIDA', 'EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA', 'ENCERRADA_SEM_ACAO');

-- CreateEnum
CREATE TYPE "ProcessoStatus" AS ENUM ('ATIVO', 'SUSPENSO', 'ENCERRADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "ProcessoOrigem" AS ENUM ('MANUAL', 'DATAJUD');

-- CreateEnum
CREATE TYPE "NotificacaoStatus" AS ENUM ('EMITIDA', 'ENTREGUE', 'RESPONDIDA', 'CONTESTADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "MultaStatus" AS ENUM ('APLICADA', 'NOTIFICADA', 'CONTESTADA', 'MANTIDA', 'CANCELADA', 'PAGA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "JuridicoEntidade" AS ENUM ('PROCESSO', 'NOTIFICACAO', 'MULTA', 'SINCRONIZACAO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSELHO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#64748B',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" DATE NOT NULL,
    "fornecedor" TEXT,
    "observacoes" TEXT,
    "periodo" TEXT NOT NULL,
    "status" "StatusPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pareceres" (
    "id" TEXT NOT NULL,
    "periodoRef" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT,
    "arquivoUrl" TEXT,
    "arquivoNome" TEXT,
    "dataEmissao" DATE NOT NULL,
    "membrosConselho" TEXT,
    "status" "StatusPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pareceres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planilhas_download" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planilhas_download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "fixado" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "orcamento" DECIMAL(12,2),
    "gasto" DECIMAL(12,2),
    "status" "StatusObra" NOT NULL DEFAULT 'PLANEJADO',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "dataInicio" DATE,
    "dataPrevista" DATE,
    "imagemUrl" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "nome" TEXT,
    "unidade" TEXT,
    "status" "StatusProposta" NOT NULL DEFAULT 'PENDENTE',
    "resposta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquetes" (
    "id" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "tipo" "TipoEnquete" NOT NULL DEFAULT 'UNICA',
    "status" "StatusPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes_enquete" (
    "id" TEXT NOT NULL,
    "enqueteId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "opcoes_enquete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_enquete" (
    "id" TEXT NOT NULL,
    "enqueteId" TEXT NOT NULL,
    "opcaoId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_enquete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "descricao" TEXT,
    "fotoUrl" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_portal" (
    "id" TEXT NOT NULL,
    "nomeCondominio" TEXT NOT NULL DEFAULT 'Condomínio Residencial Santíssima Trindade',
    "cnpj" TEXT,
    "endereco" TEXT,
    "logoUrl" TEXT,
    "periodoAtivo" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demands" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "category" "DemandCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "status" "DemandStatus" NOT NULL DEFAULT 'RECEBIDA',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_updates" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "previousStatus" "DemandStatus",
    "newStatus" "DemandStatus" NOT NULL,
    "message" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "numeroProcesso" TEXT NOT NULL,
    "tribunal" TEXT NOT NULL DEFAULT 'TJCE',
    "classe" TEXT,
    "assunto" TEXT,
    "orgaoJulgador" TEXT,
    "grau" TEXT,
    "dataAjuizamento" DATE,
    "status" "ProcessoStatus" NOT NULL DEFAULT 'ATIVO',
    "ultimaMovimentacao" TEXT,
    "dataUltimaMovim" TIMESTAMP(3),
    "resumoPublico" TEXT,
    "observacoesInternas" TEXT,
    "origem" "ProcessoOrigem" NOT NULL DEFAULT 'MANUAL',
    "ultimaSincronizacao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT,
    "bloco" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricaoInterna" TEXT,
    "status" "NotificacaoStatus" NOT NULL DEFAULT 'EMITIDA',
    "dataEmissao" DATE NOT NULL,
    "dataEntrega" DATE,
    "dataResposta" DATE,
    "anexoUrl" TEXT,
    "anexoNome" TEXT,
    "criadoPorId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multas" (
    "id" TEXT NOT NULL,
    "processoId" TEXT,
    "bloco" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricaoInterna" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "MultaStatus" NOT NULL DEFAULT 'APLICADA',
    "dataAplicacao" DATE NOT NULL,
    "dataVencimento" DATE,
    "dataPagamento" DATE,
    "anexoUrl" TEXT,
    "anexoNome" TEXT,
    "criadoPorId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "juridico_auditoria" (
    "id" TEXT NOT NULL,
    "entidade" "JuridicoEntidade" NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNovo" JSONB,
    "usuarioId" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "juridico_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "lancamentos_periodo_idx" ON "lancamentos"("periodo");

-- CreateIndex
CREATE INDEX "lancamentos_tipo_idx" ON "lancamentos"("tipo");

-- CreateIndex
CREATE INDEX "lancamentos_status_idx" ON "lancamentos"("status");

-- CreateIndex
CREATE INDEX "pareceres_periodoRef_idx" ON "pareceres"("periodoRef");

-- CreateIndex
CREATE INDEX "pareceres_status_idx" ON "pareceres"("status");

-- CreateIndex
CREATE INDEX "planilhas_download_periodo_idx" ON "planilhas_download"("periodo");

-- CreateIndex
CREATE INDEX "avisos_status_idx" ON "avisos"("status");

-- CreateIndex
CREATE INDEX "enquetes_status_idx" ON "enquetes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "votos_enquete_enqueteId_opcaoId_ip_key" ON "votos_enquete"("enqueteId", "opcaoId", "ip");

-- CreateIndex
CREATE UNIQUE INDEX "demands_protocol_key" ON "demands"("protocol");

-- CreateIndex
CREATE INDEX "demands_status_idx" ON "demands"("status");

-- CreateIndex
CREATE INDEX "demands_category_idx" ON "demands"("category");

-- CreateIndex
CREATE INDEX "demands_createdAt_idx" ON "demands"("createdAt");

-- CreateIndex
CREATE INDEX "demand_updates_demandId_idx" ON "demand_updates"("demandId");

-- CreateIndex
CREATE UNIQUE INDEX "processos_numeroProcesso_key" ON "processos"("numeroProcesso");

-- CreateIndex
CREATE INDEX "processos_status_idx" ON "processos"("status");

-- CreateIndex
CREATE INDEX "processos_ativo_idx" ON "processos"("ativo");

-- CreateIndex
CREATE INDEX "notificacoes_status_idx" ON "notificacoes"("status");

-- CreateIndex
CREATE INDEX "notificacoes_bloco_unidade_idx" ON "notificacoes"("bloco", "unidade");

-- CreateIndex
CREATE INDEX "multas_status_idx" ON "multas"("status");

-- CreateIndex
CREATE INDEX "multas_bloco_unidade_idx" ON "multas"("bloco", "unidade");

-- CreateIndex
CREATE INDEX "juridico_auditoria_entidade_entidadeId_idx" ON "juridico_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "juridico_auditoria_createdAt_idx" ON "juridico_auditoria"("createdAt");

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes_enquete" ADD CONSTRAINT "opcoes_enquete_enqueteId_fkey" FOREIGN KEY ("enqueteId") REFERENCES "enquetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_enquete" ADD CONSTRAINT "votos_enquete_enqueteId_fkey" FOREIGN KEY ("enqueteId") REFERENCES "enquetes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_enquete" ADD CONSTRAINT "votos_enquete_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "opcoes_enquete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_updates" ADD CONSTRAINT "demand_updates_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_updates" ADD CONSTRAINT "demand_updates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multas" ADD CONSTRAINT "multas_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multas" ADD CONSTRAINT "multas_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juridico_auditoria" ADD CONSTRAINT "juridico_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

