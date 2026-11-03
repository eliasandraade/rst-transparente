import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/juridico";

const PatchNotificacaoSchema = z.object({
  status: z.enum(["EMITIDA", "ENTREGUE", "RESPONDIDA", "CONTESTADA", "ARQUIVADA"]).optional(),
  dataEntrega: z.string().optional().nullable(),
  dataResposta: z.string().optional().nullable(),
  descricaoInterna: z.string().max(2000).optional().nullable(),
  anexoUrl: z.string().url().optional().nullable(),
  anexoNome: z.string().max(200).optional().nullable(),
  ativo: z.boolean().optional(),
  observacao: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const data = PatchNotificacaoSchema.parse(body);

    const atual = await db.notificacao.findUnique({ where: { id } });
    if (!atual) return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });

    const statusMudou = data.status && data.status !== atual.status;

    const atualizada = await db.notificacao.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(typeof data.dataEntrega !== "undefined"
          ? { dataEntrega: data.dataEntrega ? new Date(data.dataEntrega) : null }
          : {}),
        ...(typeof data.dataResposta !== "undefined"
          ? { dataResposta: data.dataResposta ? new Date(data.dataResposta) : null }
          : {}),
        ...(typeof data.descricaoInterna !== "undefined"
          ? { descricaoInterna: data.descricaoInterna }
          : {}),
        ...(typeof data.anexoUrl !== "undefined" ? { anexoUrl: data.anexoUrl } : {}),
        ...(typeof data.anexoNome !== "undefined" ? { anexoNome: data.anexoNome } : {}),
        ...(typeof data.ativo !== "undefined" ? { ativo: data.ativo } : {}),
      },
    });

    await registrarAuditoria({
      entidade: "NOTIFICACAO",
      entidadeId: id,
      acao: data.ativo === false ? "ARQUIVAMENTO" : statusMudou ? "MUDANCA_STATUS" : "EDICAO",
      valorAnterior: { status: atual.status, ativo: atual.ativo },
      valorNovo: { status: atualizada.status, ativo: atualizada.ativo },
      usuarioId: (session.user as { id?: string })?.id ?? null,
      observacao: data.observacao,
    });

    return NextResponse.json(atualizada);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/juridico/notificacoes/[id]]", err);
    return NextResponse.json({ error: "Erro ao atualizar notificação." }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await tenantDb();
  const session = await staffSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!can(session, "juridico.editar")) return forbidden();

  const { id } = await params;

  try {
    const notificacao = await db.notificacao.findUnique({
      where: { id },
      include: {
        criadoPor: { select: { name: true, email: true } },
        processo: { select: { id: true, numeroProcesso: true, classe: true } },
      },
    });

    if (!notificacao) return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });

    return NextResponse.json(notificacao);
  } catch (err) {
    console.error("[GET /api/juridico/notificacoes/[id]]", err);
    return NextResponse.json({ error: "Erro ao buscar notificação." }, { status: 500 });
  }
}
