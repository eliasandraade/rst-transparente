import { NextResponse } from "next/server";
import { staffSession, can, forbidden } from "@/lib/staff";
import { RATE_LIMITS, rateLimit, rateLimitResponseBody } from "@/lib/rate-limit";
import { uploadPublicPdf } from "@/lib/files";
import { requireTenant } from "@/lib/tenant";
import { errorSummary } from "@/lib/privacy";

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: Request) {
  const { org } = await requireTenant();
  const session = await staffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!can(session, "arquivos.enviar")) return forbidden();
  // Envio de arquivo pela equipe: limite por conta, compartilhado entre réplicas.
  const limited = await rateLimit(RATE_LIMITS.adminUpload, `staff:${session.user.id}`);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponseBody(limited), { status: limited.reason === "limited" ? 429 : 503 });
  }

  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo") as File | null;

    if (!arquivo) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (arquivo.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Apenas arquivos PDF são permitidos" },
        { status: 400 }
      );
    }

    if (arquivo.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${MAX_SIZE_MB} MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const { url, publicId } = await uploadPublicPdf(org.id, "pareceres", buffer, arquivo.name);

    return NextResponse.json({ url, publicId, nome: arquivo.name });
  } catch (err) {
    console.error("[POST /api/upload]", errorSummary(err));
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 });
  }
}
