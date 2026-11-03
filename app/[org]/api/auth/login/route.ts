import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { openSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/client-ip";
import { RATE_LIMITS, rateLimit, rateLimitResponseBody } from "@/lib/rate-limit";

/** bcrypt (custo 12) de um valor aleatório descartado: conta inexistente custa o mesmo que senha errada. */
const DUMMY_PASSWORD_HASH = "$2a$12$oC7qH4I5pMqlirmEAvkpD.xeYDZfcqwz2wVQi8eYPJ6Wh.wrNzsNi";

const LoginSchema = z.object({
  // Teclado do celular costuma pôr maiúscula ou espaço no fim do e-mail
  email: z.string().trim().toLowerCase().min(3).max(254),
  password: z.string().min(1).max(256),
});

const INVALID = { error: "E-mail ou senha inválidos." };

/**
 * Login local da equipe, só no condomínio do caminho. Conta vinculada ao Orken ID
 * não entra mais por senha: mesma resposta e mesmo custo da senha errada.
 */
export async function POST(request: Request) {
  const { db } = await requireTenant();
  const limited = await rateLimit(RATE_LIMITS.login, clientIp(request));
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponseBody(limited), { status: limited.reason === "limited" ? 429 : 503 });
  }
  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(INVALID, { status: 401 });
  const { email, password } = parsed.data;

  const user = await db.user.findFirst({
    where: { email },
    select: { id: true, password: true, ativo: true, orkenSubject: true },
  });
  const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
  if (!user || !user.ativo || !passwordOk || user.orkenSubject) {
    await audit(db, "LOGIN_FAILED", { userId: user?.id ?? null, detail: { orkenLinked: !!user?.orkenSubject } });
    return NextResponse.json(INVALID, { status: 401 });
  }

  await openSession(db, { userId: user.id, authMethod: "PASSWORD" });
  await audit(db, "LOGIN_PASSWORD", { userId: user.id });
  return NextResponse.json({ ok: true });
}
