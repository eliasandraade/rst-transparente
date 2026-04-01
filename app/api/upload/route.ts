import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadParecer } from "@/lib/cloudinary";

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
    const { url, publicId } = await uploadParecer(buffer, arquivo.name);

    return NextResponse.json({ url, publicId, nome: arquivo.name });
  } catch (err) {
    console.error("Erro no upload:", err);
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 });
  }
}
