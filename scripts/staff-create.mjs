/**
 * Cria uma conta da equipe num condomínio, para entrar pela conta Orken: a senha
 * local é aleatória e descartada (ninguém a conhece), e o primeiro login pela conta
 * Orken com o mesmo e-mail verificado vincula a conta (docs/orken-cond/identidade.md,
 * seção 5). Serve para a primeira pessoa da gestão de um condomínio novo; as demais
 * são criadas por ela na tela de usuários. O papel é sempre explícito.
 *
 *   node scripts/staff-create.mjs <slug> <email> "<nome>" <MASTER|SINDICO|GESTAO|CONSELHO>
 *   node scripts/staff-create.mjs <slug> <email> "<nome>" <papel> --apply
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const ROLES = new Set(["MASTER", "SINDICO", "GESTAO", "CONSELHO"]);
const [slug, rawEmail, rawName, role, flag] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
const name = rawName?.trim();
if (!slug || !email || !name || !role) {
  console.error('uso: node scripts/staff-create.mjs <slug> <email> "<nome>" <papel> [--apply]');
  process.exit(2);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error("e-mail inválido");
  process.exit(2);
}
if (!ROLES.has(role)) {
  console.error("papel: MASTER, SINDICO, GESTAO ou CONSELHO");
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true, status: true } });
  if (!org || org.status !== "ACTIVE") throw new Error("organização inexistente ou desativada");
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${org.id}, TRUE)`;
    if (await tx.user.findFirst({ where: { organizationId: org.id, email }, select: { id: true } })) {
      throw new Error("já existe conta com este e-mail neste condomínio");
    }
    if (flag !== "--apply") {
      console.log(`faria: conta ${role} em ${slug}, entrada só pela conta Orken; rode com --apply`);
      return;
    }
    // Senha aleatória descartada: a conta só entra pelo Orken ID.
    const password = await bcrypt.hash(randomBytes(32).toString("base64url"), 12);
    const user = await tx.user.create({
      data: { organizationId: org.id, email, name, role, password },
      select: { id: true },
    });
    await tx.staffAuditEvent.create({
      data: { organizationId: org.id, action: "STAFF_CREATED", userId: user.id, detail: { role, via: "operator" } },
    });
    console.log(`criada: conta ${role} em ${slug} (${user.id})`);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "erro");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
