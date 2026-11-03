import bcrypt from "bcryptjs";

// Charset sem caracteres ambíguos (0, O, 1, I removidos)
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 6): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

export function generateProtocol(year: number): string {
  return `RST-${year}-${generateCode(6)}`;
}

export async function hashAccessCode(plainCode: string): Promise<string> {
  return bcrypt.hash(plainCode, 10);
}

export async function verifyAccessCode(
  input: string,
  hash: string
): Promise<boolean> {
  // O código é gerado em maiúsculas; o morador pode digitar em minúsculas (spec da Central de Demandas).
  return bcrypt.compare(input.trim().toUpperCase(), hash);
}

/** bcrypt de um código que nunca confere: a consulta paga o mesmo custo com ou sem protocolo existente. */
export const DUMMY_ACCESS_CODE_HASH = "$2a$10$Rz8C8MrAqiWJl3KOxIcZueUn/hj7k4PrEzMECsnrFpwA/sDwwjtOm";

export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

// Rate limit distribuído: lib/rate-limit.ts. IP confiável: lib/client-ip.ts.
export { clientIp as getClientIp } from "@/lib/client-ip";
