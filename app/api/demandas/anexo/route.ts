import { NextResponse } from "next/server";
import { uploadAnexoDemanda } from "@/lib/cloudinary";
import { checkRateLimit, getClientIp } from "@/lib/demandas";

// Upload público de anexo da demanda (morador não tem login).
// Separado de /api/upload, que continua restrito ao admin (pareceres).

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Detecta o tipo real pelos primeiros bytes — não confia na extensão nem no MIME do navegador
function detectarTipo(buf: Buffer): "jpg" | "png" | "webp" | "pdf" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  return null;
}

export async function POST(request: Request) {
  if (!checkRateLimit(`anexo:${getClientIp(request)}`, 10, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Muitos envios seguidos. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const arquivo = formData.get("file");

    if (!(arquivo instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (arquivo.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${MAX_SIZE_MB} MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const tipo = detectarTipo(buffer);
    if (!tipo) {
      return NextResponse.json(
        { error: "Formato inválido. Use foto (JPG, PNG) ou PDF." },
        { status: 400 }
      );
    }

    const { url } = await uploadAnexoDemanda(buffer, arquivo.name, tipo === "pdf");
    return NextResponse.json({ url, nome: arquivo.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/demandas/anexo]", err);
    return NextResponse.json(
      { error: "Erro ao enviar arquivo. Tente novamente." },
      { status: 500 }
    );
  }
}
