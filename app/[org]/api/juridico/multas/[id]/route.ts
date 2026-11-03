import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { tenantDb } from "@/lib/tenant";
import { z } from "zod";
import { moneySchema } from "@/lib/money";
import { registrarAuditoria } from "@/lib/juridico";
import { errorSummary } from "@/lib/privacy";

const PatchMultaSchema = z.object({
  status: z.enum(["APLICADA", "NOTIFICADA", "CONTESTADA", "MANTIDA", "CANCELADA", "PAGA", "VENCIDA"]).optional(),
  valor: moneySchema({ positive: true }).optional(),
  dataVencimento: z.string().optional().nullable(),
  dataPagamento: z.string().optional().nullable(),
  descricaoInterna: z.string().max(2000).optional().nullable(),
  anexoUrl: z.string().url().max(500).refine((u) => u.startsWith("https://"), "Link precisa ser https").optional().nullable(),
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
    const data = PatchMultaSchema.parse(body);

    const atual = await db.multa.findUnique({ where: { id } });
    if (!atual) return NextResponse.json({ error: "Multa não encontrada" }, { status: 404 });

    const statusMudou = data.status && data.status !== atual.status;

    const atualizada = await db.multa.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.valor ? { valor: data.valor } : {}),
        ...(typeof data.dataVencimento !== "undefined"
          ? { dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null }
          : {}),
        ...(typeof data.dataPagamento !== "undefined"
          ? { dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null }
          : {}),
        ...(typeof data.descricaoInterna !== "undefined"
          ? { descricaoInterna: data.descricaoInterna }
          : {}),
        ...(typeof data.anexoUrl !== "undefined" ? { anexoUrl: data.anexoUrl } : {}),
        ...(typeof data.anexoNome !== "undefined" ? { anexoNome: data.anexoNome } : {}),
        ...(typeof data.ativo !== "undefined" ? { ativo: data.ativo } : {}),
      },
    });

    const acao = data.ativo === false
      ? "ARQUIVAMENTO"
      : data.status === "PAGA"
      ? "PAGAMENTO"
      : data.status === "CANCELADA"
      ? "CANCELAMENTO"
      : statusMudou
      ? "MUDANCA_STATUS"
      : "EDICAO";

    await registrarAuditoria({
      entidade: "MULTA",
      entidadeId: id,
      acao,
      valorAnterior: { status: atual.status, valor: Number(atual.valor), ativo: atual.ativo },
      valorNovo: { status: atualizada.status, valor: Number(atualizada.valor), ativo: atualizada.ativo },
      usuarioId: (session.user as { id?: string })?.id ?? null,
      observacao: data.observacao,
    });

    return NextResponse.json(atualizada);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/juridico/multas/[id]]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao atualizar multa." }, { status: 500 });
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
    const multa = await db.multa.findUnique({
      where: { id },
      include: {
        criadoPor: { select: { name: true, email: true } },
        processo: { select: { id: true, numeroProcesso: true, classe: true } },
      },
    });

    if (!multa) return NextResponse.json({ error: "Multa não encontrada" }, { status: 404 });

    return NextResponse.json(multa);
  } catch (err) {
    console.error("[GET /api/juridico/multas/[id]]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao buscar multa." }, { status: 500 });
  }
}
