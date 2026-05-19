import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { registrarAuditoria, validarBloco, validarUnidade } from "@/lib/juridico";
import type { MultaStatus } from "@prisma/client";

const VALID_STATUS: MultaStatus[] = [
  "APLICADA", "NOTIFICADA", "CONTESTADA", "MANTIDA", "CANCELADA", "PAGA", "VENCIDA",
];

const CreateMultaSchema = z.object({
  processoId: z.string().optional().nullable(),
  bloco: z.string().min(1).max(1).toUpperCase(),
  unidade: z.string().min(3).max(3),
  motivo: z.string().min(3, "Motivo muito curto").max(200),
  descricaoInterna: z.string().max(2000).optional().nullable(),
  valor: z.number().positive("Valor deve ser positivo"),
  dataAplicacao: z.string().min(1, "Data de aplicação obrigatória"),
  dataVencimento: z.string().optional().nullable(),
  anexoUrl: z.string().url().optional().nullable(),
  anexoNome: z.string().max(200).optional().nullable(),
}).refine((d) => validarBloco(d.bloco), { message: "Bloco inválido (A–I)", path: ["bloco"] })
  .refine((d) => validarUnidade(d.unidade), { message: "Unidade inválida", path: ["unidade"] });

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = CreateMultaSchema.parse(body);
    const usuarioId = (session.user as { id?: string })?.id ?? null;

    const multa = await prisma.multa.create({
      data: {
        processoId: data.processoId ?? null,
        bloco: data.bloco.toUpperCase(),
        unidade: data.unidade,
        motivo: data.motivo,
        descricaoInterna: data.descricaoInterna ?? null,
        valor: data.valor,
        dataAplicacao: new Date(data.dataAplicacao),
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
        anexoUrl: data.anexoUrl ?? null,
        anexoNome: data.anexoNome ?? null,
        criadoPorId: usuarioId,
      },
    });

    await registrarAuditoria({
      entidade: "MULTA",
      entidadeId: multa.id,
      acao: "CRIACAO",
      valorAnterior: null,
      valorNovo: {
        bloco: multa.bloco,
        unidade: multa.unidade,
        motivo: multa.motivo,
        valor: Number(multa.valor),
      },
      usuarioId,
    });

    return NextResponse.json(multa, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/juridico/multas]", err);
    return NextResponse.json({ error: "Erro ao criar multa." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const bloco = searchParams.get("bloco") ?? undefined;
  const unidade = searchParams.get("unidade") ?? undefined;

  const status =
    rawStatus && VALID_STATUS.includes(rawStatus as MultaStatus)
      ? (rawStatus as MultaStatus)
      : undefined;

  try {
    const multas = await prisma.multa.findMany({
      where: {
        ativo: true,
        ...(status ? { status } : {}),
        ...(bloco ? { bloco: bloco.toUpperCase() } : {}),
        ...(unidade ? { unidade } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        criadoPor: { select: { name: true } },
        processo: { select: { id: true, numeroProcesso: true, classe: true } },
      },
    });

    return NextResponse.json(multas);
  } catch (err) {
    console.error("[GET /api/juridico/multas]", err);
    return NextResponse.json({ error: "Erro ao buscar multas." }, { status: 500 });
  }
}
