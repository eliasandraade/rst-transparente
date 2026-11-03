import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Seed de DEMONSTRAÇÃO, só para desenvolvimento local. Nunca roda em produção,
 * nunca tem senha padrão e nunca imprime credenciais: exige ALLOW_DEMO_SEED=1,
 * SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (12+ caracteres) no ambiente de quem roda.
 * Cria só a organização de demonstração (`condominio-demo`); nenhuma outra é tocada.
 * O esquema vem das migrations (prisma migrate deploy), não daqui.
 */
const prisma = new PrismaClient();

const DEMO_SLUG = "condominio-demo";

function demoSeedSettings(): { email: string; password: string; name: string } {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error("seed de demonstração recusado: só com ALLOW_DEMO_SEED=1 e fora de produção");
  }
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!email || password.length < 12) {
    throw new Error("defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (12+ caracteres); não há valores padrão");
  }
  return { email, password, name: process.env.SEED_ADMIN_NAME?.trim() || "Administrador" };
}

async function main() {
  const settings = demoSeedSettings();
  console.log("Seed de demonstração...");

  const org = await prisma.organization.upsert({
    where: { slug: DEMO_SLUG },
    update: {},
    create: {
      slug: DEMO_SLUG,
      name: "Condomínio de Demonstração",
      shortName: "Demonstração",
      protocolPrefix: "DEM",
    },
  });
  const organizationId = org.id;

  // ─── Admin master ────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash(settings.password, 12);
  const admin = await prisma.user.upsert({
    where: { organizationId_email: { organizationId, email: settings.email } },
    update: {},
    create: { organizationId, email: settings.email, name: settings.name, password: senhaHash, role: "MASTER" },
  });
  console.log(`Conta administrativa de demonstração pronta: ${admin.id}`);

  // ─── Configuração do portal ───────────────────────────────────────────────────
  await prisma.configPortal.upsert({
    where: { organizationId },
    update: {},
    create: { organizationId, nomeCondominio: org.name, periodoAtivo: new Date().toISOString().slice(0, 7) },
  });
  console.log("Configuração do portal pronta");

  // ─── Categorias padrão ────────────────────────────────────────────────────────
  const categorias = [
    ...[
      { nome: "Taxa de Condomínio", cor: "#22C55E", ordem: 1 },
      { nome: "Fundo de Reserva", cor: "#16A34A", ordem: 2 },
      { nome: "Multas e Juros", cor: "#4ADE80", ordem: 3 },
      { nome: "Outras Receitas", cor: "#86EFAC", ordem: 4 },
    ].map((cat) => ({ ...cat, tipo: "RECEITA" as const })),
    ...[
      { nome: "Manutenção e Reparos", cor: "#EF4444", ordem: 1 },
      { nome: "Limpeza e Conservação", cor: "#F97316", ordem: 2 },
      { nome: "Água e Esgoto", cor: "#3B82F6", ordem: 3 },
      { nome: "Energia Elétrica", cor: "#F59E0B", ordem: 4 },
      { nome: "Portaria e Segurança", cor: "#8B5CF6", ordem: 5 },
      { nome: "Administração", cor: "#64748B", ordem: 6 },
      { nome: "Seguros", cor: "#EC4899", ordem: 7 },
      { nome: "Outras Despesas", cor: "#94A3B8", ordem: 8 },
    ].map((cat) => ({ ...cat, tipo: "DESPESA" as const })),
  ];

  for (const cat of categorias) {
    const id = `${DEMO_SLUG}-${cat.tipo.toLowerCase()}-${cat.nome.toLowerCase().replace(/\s+/g, "-")}`;
    await prisma.categoria.upsert({ where: { id }, update: {}, create: { id, organizationId, ...cat } });
  }
  console.log("Categorias de demonstração prontas");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
