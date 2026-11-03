import { v2 as cloudinary } from "cloudinary";

/**
 * Arquivos no Cloudinary, separados por organização e por sensibilidade
 * (docs/orken-cond/arquitetura.md, seção 6):
 *
 * - públicos (parecer, planilha): `orken-cond/{organização}/{módulo}`, entrega pública;
 * - privados (anexo de demanda, com dados de morador): entrega `authenticated`. O banco
 *   guarda só uma referência (`cond-file:`), nunca uma URL; quem pode ver recebe um
 *   link assinado de 10 minutos, gerado na hora pela rota autorizada.
 *
 * Nenhum arquivo antigo é movido ou apagado: URLs já gravadas seguem como estão.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type FileModule = "pareceres" | "planilhas" | "demandas";

const REF_PREFIX = "cond-file:";
const SIGNED_TTL_SECONDS = 600;

function folder(organizationId: string, module: FileModule): string {
  return `orken-cond/${organizationId}/${module}`;
}

function publicIdFrom(filename: string): string {
  return `${Date.now()}-${filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 80) || "arquivo"}`;
}

interface Uploaded {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
}

function upload(buffer: Buffer, options: Record<string, unknown>): Promise<Uploaded> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ overwrite: false, ...options }, (error, result) => {
        if (error || !result) reject(error ?? new Error("upload falhou"));
        else resolve(result as Uploaded);
      })
      .end(buffer);
  });
}

/** Documento público da organização (parecer, planilha): URL de entrega pública. */
export async function uploadPublicPdf(
  organizationId: string,
  module: "pareceres" | "planilhas",
  buffer: Buffer,
  filename: string,
  format = "pdf"
): Promise<{ url: string; publicId: string }> {
  const result = await upload(buffer, {
    folder: folder(organizationId, module),
    resource_type: "raw",
    format,
    public_id: publicIdFrom(filename),
  });
  return { url: result.secure_url, publicId: result.public_id };
}

/** Anexo privado de demanda: devolve a referência a guardar no banco. */
export async function uploadPrivateAttachment(
  organizationId: string,
  buffer: Buffer,
  filename: string,
  kind: "pdf" | "image"
): Promise<string> {
  const result = await upload(buffer, {
    folder: folder(organizationId, "demandas"),
    type: "authenticated",
    resource_type: kind === "pdf" ? "raw" : "image",
    ...(kind === "pdf" ? { format: "pdf" } : {}),
    public_id: publicIdFrom(filename),
  });
  return `${REF_PREFIX}${result.resource_type}:${result.format ?? (kind === "pdf" ? "pdf" : "jpg")}:${result.public_id}`;
}

interface FileRef {
  resourceType: "raw" | "image";
  format: string;
  publicId: string;
}

const REF = /^cond-file:(raw|image):([a-z0-9]{2,5}):(orken-cond\/[0-9a-f-]{36}\/demandas\/[A-Za-z0-9-]{1,120})$/;

/** Referência de anexo válida E desta organização (nunca a pasta de outra). */
export function parseAttachmentRef(value: string, organizationId: string): FileRef | null {
  const match = REF.exec(value);
  if (!match) return null;
  const [, resourceType, format, publicId] = match;
  if (!publicId!.startsWith(`orken-cond/${organizationId}/demandas/`)) return null;
  return { resourceType: resourceType as FileRef["resourceType"], format: format!, publicId: publicId! };
}

export const isAttachmentRef = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.startsWith(REF_PREFIX);

/**
 * Link para quem pode ver o anexo agora: referência privada vira link assinado de 10
 * min; URL antiga (anterior à separação) segue como está; o resto, nada.
 */
export function attachmentLink(value: string | null, organizationId: string, now: number = Date.now()): string | null {
  if (!value) return null;
  if (!isAttachmentRef(value)) return value.startsWith("https://") ? value : null;
  const ref = parseAttachmentRef(value, organizationId);
  if (!ref) return null;
  return cloudinary.utils.private_download_url(ref.publicId, ref.format, {
    resource_type: ref.resourceType,
    type: "authenticated",
    expires_at: Math.floor(now / 1000) + SIGNED_TTL_SECONDS,
    attachment: false,
  });
}

export async function deletePublicFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}
