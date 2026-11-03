import { NextResponse } from "next/server";
import { tenantDb } from "@/lib/tenant";
import { mascarNumeroProcesso } from "@/lib/juridico";
import { sumMoney, moneyToNumber } from "@/lib/money";

export async function GET() {
  const db = await tenantDb();
  try {
    const [
      processosAtivos,
      processosEncerrados,
      totalNotificacoes,
      totalMultas,
      multasPorStatus,
      processosList,
    ] = await Promise.all([
      db.processo.count({ where: { ativo: true, status: { in: ["ATIVO", "SUSPENSO"] } } }),
      db.processo.count({ where: { ativo: true, status: { in: ["ENCERRADO", "ARQUIVADO"] } } }),
      db.notificacao.count({ where: { ativo: true } }),
      db.multa.count({ where: { ativo: true } }),
      db.multa.groupBy({
        by: ["status"],
        where: { ativo: true },
        _count: { id: true },
        _sum: { valor: true },
      }),
      db.processo.findMany({
        where: { ativo: true },
        orderBy: { dataUltimaMovim: "desc" },
        select: {
          id: true,
          numeroProcesso: true,
          tribunal: true,
          classe: true,
          assunto: true,
          status: true,
          dataUltimaMovim: true,
          resumoPublico: true,
        },
      }),
    ]);

    const valorTotalMultas = moneyToNumber(sumMoney(multasPorStatus.map((m) => m._sum.valor)));

    const processosMascarados = processosList.map((p) => ({
      id: p.id,
      numeroMascarado: mascarNumeroProcesso(p.numeroProcesso),
      tribunal: p.tribunal,
      classe: p.classe,
      assunto: p.assunto,
      status: p.status,
      dataUltimaMovim: p.dataUltimaMovim,
      resumoPublico: p.resumoPublico,
    }));

    return NextResponse.json({
      metricas: {
        processosAtivos,
        processosEncerrados,
        totalNotificacoes,
        totalMultas,
        valorTotalMultas,
      },
      processos: processosMascarados,
    });
  } catch (err) {
    console.error("[GET /api/juridico/public]", err);
    return NextResponse.json({ error: "Erro ao buscar dados jurídicos." }, { status: 500 });
  }
}
