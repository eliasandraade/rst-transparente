import { NextResponse } from "next/server";
import { uploadPrivateAttachment } from "@/lib/files";
import { requireTenant } from "@/lib/tenant";
import { errorSummary } from "@/lib/privacy";
import { clientIp } from "@/lib/client-ip";
import { RATE_LIMITS, rateLimit, rateLimitResponseBody } from "@/lib/rate-limit";

// Upload público de anexo da demanda (morador não tem login). O arquivo fica privado
// (lib/files.ts): a resposta traz só a referência, que a criação da demanda confere.
// Separado de /api/upload, que continua restrito à gestão (pareceres).

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
  const { org } = await requireTenant();
  const limited = await rateLimit(RATE_LIMITS.demandAttachment, clientIp(request));
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponseBody(limited), { status: limited.reason === "limited" ? 429 : 503 });
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

    const ref = await uploadPrivateAttachment(org.id, buffer, arquivo.name, tipo === "pdf" ? "pdf" : "image");
    return NextResponse.json({ ref, nome: arquivo.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/demandas/anexo]", errorSummary(err));
    return NextResponse.json(
      { error: "Erro ao enviar arquivo. Tente novamente." },
      { status: 500 }
    );
  }
}
