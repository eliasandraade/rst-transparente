import { NextRequest, NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { RATE_LIMITS, rateLimit, rateLimitResponseBody } from "@/lib/rate-limit";
import { parsePlanilha } from "@/lib/parser-planilha";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!can(session, "importacao.executar")) return forbidden();
  // Envio de arquivo pela equipe: limite por conta, compartilhado entre réplicas.
  const limited = await rateLimit(RATE_LIMITS.adminUpload, `staff:${session.user.id}`);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponseBody(limited), { status: limited.reason === "limited" ? 429 : 503 });
  }

  const form = await req.formData();
  const arquivo = form.get("arquivo") as File | null;

  if (!arquivo) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const ext = arquivo.name.split(".").pop()?.toLowerCase();
  if (!["xls", "xlsx"].includes(ext ?? "")) {
    return NextResponse.json(
      { error: "Envie um arquivo .xls ou .xlsx" },
      { status: 400 }
    );
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máx. 10 MB)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const abas = parsePlanilha(buffer);

  return NextResponse.json(abas);
}
