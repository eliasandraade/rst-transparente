import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadParecer } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const PERIODO_REGEX = /^\d{4}-\d{2}$/;
const EXTENSOES_PERMITIDAS = [".xls", ".xlsx"];

export async function GET() {
  try {
    const planilhas = await prisma.planilhaDownload.findMany({
      orderBy: { periodo: "desc" },
    });
    return NextResponse.json(planilhas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar planilhas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const periodo = formData.get("periodo") as string | null;

    if (!arquivo) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }
    if (!periodo || !PERIODO_REGEX.test(periodo)) {
      return NextResponse.json({ error: "Período inválido. Use o formato YYYY-MM" }, { status: 400 });
    }

    const nomeArquivo = arquivo.name.toLowerCase();
    const extensaoValida = EXTENSOES_PERMITIDAS.some((ext) => nomeArquivo.endsWith(ext));
    if (!extensaoValida) {
      return NextResponse.json({ error: "Apenas arquivos .xls ou .xlsx são permitidos" }, { status: 400 });
    }

    if (arquivo.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo: 10 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { url } = await uploadParecer(buffer, arquivo.name);

    const planilha = await prisma.planilhaDownload.create({
      data: {
        periodo,
        arquivoUrl: url,
        arquivoNome: arquivo.name,
      },
    });

    return NextResponse.json(planilha, { status: 201 });
  } catch (err) {
    console.error("Erro no upload de planilha:", err);
    return NextResponse.json({ error: "Erro ao fazer upload da planilha" }, { status: 500 });
  }
}
