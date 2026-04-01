import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // ─── Admin master ────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@condominio.com";
  const adminSenha = process.env.SEED_ADMIN_PASSWORD ?? "Mudar@123";
  const adminNome = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const senhaHash = await bcrypt.hash(adminSenha, 12);

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
  console.log(`✅ Admin criado: ${admin.email}`);

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
  console.log("✅ Configuração do portal criada");

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

  console.log(
    `✅ ${categoriasReceita.length + categoriasDespesa.length} categorias criadas`
  );

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`\n📋 Credenciais de acesso:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Senha: ${adminSenha}`);
  console.log(`\n⚠️  Altere a senha após o primeiro login!`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
