import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parsePlanilha } from "@/lib/parser-planilha";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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
