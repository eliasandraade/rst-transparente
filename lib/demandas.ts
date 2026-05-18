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
  return bcrypt.compare(input, hash);
}

export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

// Rate limiter in-memory (MVP — migrar para Redis se necessário)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  ip: string,
  limit = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
