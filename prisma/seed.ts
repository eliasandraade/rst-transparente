import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Seed de DEMONSTRAÇÃO, só para desenvolvimento local. Nunca roda em produção,
 * nunca tem senha padrão e nunca imprime credenciais: exige ALLOW_DEMO_SEED=1,
 * SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (12+ caracteres) no ambiente de quem roda.
 * O esquema vem das migrations (prisma migrate deploy), não daqui.
 */
const prisma = new PrismaClient();

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

  // ─── Admin master ────────────────────────────────────────────────────────────
  const adminEmail = settings.email;
  const adminNome = settings.name;

  const senhaHash = await bcrypt.hash(settings.password, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminNome,
      password: senhaHash,
      role: "MASTER",
    },
  });
  console.log(`Conta administrativa de demonstração pronta: ${admin.id}`);

  // ─── Configuração do portal ───────────────────────────────────────────────────
  await prisma.configPortal.upsert({
    where: { id: "config-principal" },
    update: {},
    create: {
      id: "config-principal",
      nomeCondominio: "Condomínio Residencial Santíssima Trindade",
      periodoAtivo: new Date().toISOString().slice(0, 7),
    },
  });
  console.log("Configuração do portal pronta");

  // ─── Categorias padrão ────────────────────────────────────────────────────────
  const categoriasReceita = [
    { nome: "Taxa de Condomínio", cor: "#22C55E", ordem: 1 },
    { nome: "Fundo de Reserva", cor: "#16A34A", ordem: 2 },
    { nome: "Multas e Juros", cor: "#4ADE80", ordem: 3 },
    { nome: "Outras Receitas", cor: "#86EFAC", ordem: 4 },
  ];

  const categoriasDespesa = [
    { nome: "Manutenção e Reparos", cor: "#EF4444", ordem: 1 },
    { nome: "Limpeza e Conservação", cor: "#F97316", ordem: 2 },
    { nome: "Água e Esgoto", cor: "#3B82F6", ordem: 3 },
    { nome: "Energia Elétrica", cor: "#F59E0B", ordem: 4 },
    { nome: "Portaria e Segurança", cor: "#8B5CF6", ordem: 5 },
    { nome: "Administração", cor: "#64748B", ordem: 6 },
    { nome: "Seguros", cor: "#EC4899", ordem: 7 },
    { nome: "Outras Despesas", cor: "#94A3B8", ordem: 8 },
  ];

  for (const cat of categoriasReceita) {
    await prisma.categoria.upsert({
      where: { id: `receita-${cat.nome.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `receita-${cat.nome.toLowerCase().replace(/\s+/g, "-")}`,
        nome: cat.nome,
        tipo: "RECEITA",
        cor: cat.cor,
        ordem: cat.ordem,
      },
    });
  }

  for (const cat of categoriasDespesa) {
    await prisma.categoria.upsert({
      where: { id: `despesa-${cat.nome.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `despesa-${cat.nome.toLowerCase().replace(/\s+/g, "-")}`,
        nome: cat.nome,
        tipo: "DESPESA",
        cor: cat.cor,
        ordem: cat.ordem,
      },
    });
  }

  console.log(`${categoriasReceita.length + categoriasDespesa.length} categorias prontas`);
}

main()
  .catch((e) => {
    console.error(`Seed não concluído: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
