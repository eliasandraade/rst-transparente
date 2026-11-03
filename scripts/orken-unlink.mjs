/**
 * Desfaz o vínculo de uma conta da equipe com o Orken ID (rollback operacional):
 * a conta volta a entrar com a senha local e as sessões abertas pelo Orken ID
 * terminam. Mesma regra de lib/orken/login.ts (unlinkAccount).
 *
 *   node scripts/orken-unlink.mjs <slug> <email>            # mostra o que faria
 *   node scripts/orken-unlink.mjs <slug> <email> --apply    # grava
 */
import { PrismaClient } from "@prisma/client";

const [slug, rawEmail, flag] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
if (!slug || !email) {
  console.error("uso: node scripts/orken-unlink.mjs <slug> <email> [--apply]");
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
  if (!org) throw new Error("organização inexistente");
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${org.id}, TRUE)`;
    const user = await tx.user.findFirst({
      where: { organizationId: org.id, email },
      select: { id: true, orkenSubject: true },
    });
    if (!user) throw new Error("conta inexistente nesta organização");
    if (!user.orkenSubject) {
      console.log("conta sem vínculo; nada a fazer");
      return;
    }
    if (flag !== "--apply") {
      console.log("faria: desvincular a conta e encerrar as sessões do Orken ID; rode com --apply");
      return;
    }
    await tx.user.update({ where: { id: user.id }, data: { orkenSubject: null, orkenLinkedAt: null } });
    const { count } = await tx.staffSession.updateMany({
      where: { userId: user.id, organizationId: org.id, authMethod: "ORKEN_ID", revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "orken_unlinked" },
    });
    await tx.staffAuditEvent.create({
      data: { organizationId: org.id, action: "ORKEN_UNLINKED", userId: user.id, detail: { sessionsRevoked: count } },
    });
    console.log(`desvinculada; sessões do Orken ID encerradas: ${count}`);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "erro");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
