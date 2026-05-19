import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mascarNumeroProcesso } from "@/lib/juridico";

export async function GET() {
  try {
    const [
      processosAtivos,
      processosEncerrados,
      totalNotificacoes,
      totalMultas,
      multasPorStatus,
      processosList,
    ] = await Promise.all([
      prisma.processo.count({ where: { ativo: true, status: { in: ["ATIVO", "SUSPENSO"] } } }),
      prisma.processo.count({ where: { ativo: true, status: { in: ["ENCERRADO", "ARQUIVADO"] } } }),
      prisma.notificacao.count({ where: { ativo: true } }),
      prisma.multa.count({ where: { ativo: true } }),
      prisma.multa.groupBy({
        by: ["status"],
        where: { ativo: true },
        _count: { id: true },
        _sum: { valor: true },
      }),
      prisma.processo.findMany({
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

    const valorTotalMultas = multasPorStatus.reduce(
      (acc, m) => acc + Number(m._sum.valor ?? 0),
      0
    );

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
