/**
 * Cria um condomínio (organização) no Orken COND. Dry run por padrão: mostra o que
 * faria e só grava com --apply. Nada tem valor padrão nem é inventado: o arquivo traz
 * o que o condomínio informou. O slug é o mesmo da organização na Orken Platform;
 * depois, `node scripts/platform-link.mjs <slug> --apply` liga as duas.
 *
 *   node scripts/organization-create.mjs <organizacao.json>
 *   node scripts/organization-create.mjs <organizacao.json> --apply
 *
 * organizacao.json:
 *   {
 *     "slug": "nome-do-condominio",          // igual ao da Platform
 *     "name": "Condomínio Residencial ...",  // nome oficial
 *     "shortName": "...",                    // nome curto do portal
 *     "protocolPrefix": "ABC",               // prefixo dos protocolos da Central de Demandas
 *     "datajudTribunal": "TJCE",             // sigla do tribunal no DataJud
 *     "unitLayout": { "blocos": ["A"], "unidades": ["101"] }   // opcional
 *   }
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const RESERVED = new Set(["api", "admin", "entrar", "sair", "orken", "static", "assets", "health", "login", "www", "cond", "_next", "brand"]);
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const CODE = /^[A-Z0-9-]{1,10}$/;

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("uso: node scripts/organization-create.mjs <organizacao.json> [--apply]");
  process.exit(2);
}

function fail(message) {
  console.error(`recusado: ${message}`);
  process.exit(1);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {
  fail("arquivo ausente ou JSON inválido");
}
const text = (name, max) => {
  const value = typeof input[name] === "string" ? input[name].trim() : "";
  if (!value) fail(`${name} vazio`);
  if (value.length > max) fail(`${name} com mais de ${max} caracteres`);
  return value;
};
const slug = text("slug", 63);
if (!SLUG.test(slug) || RESERVED.has(slug)) fail("slug inválido ou reservado");
const name = text("name", 200);
const shortName = text("shortName", 80);
const protocolPrefix = text("protocolPrefix", 6).toUpperCase();
if (!/^[A-Z]{2,6}$/.test(protocolPrefix)) fail("protocolPrefix: 2 a 6 letras");
const datajudTribunal = text("datajudTribunal", 10).toUpperCase();
if (!/^[A-Z0-9]{2,10}$/.test(datajudTribunal)) fail("datajudTribunal: sigla do tribunal (TJCE, TJSP...)");
let unitLayout = null;
if (input.unitLayout !== undefined) {
  const { blocos, unidades } = input.unitLayout ?? {};
  const valid = (list) => Array.isArray(list) && list.length > 0 && list.every((item) => typeof item === "string" && CODE.test(item));
  if (!valid(blocos) || !valid(unidades)) fail("unitLayout: listas de blocos e unidades (A-Z, 0-9, hífen, até 10)");
  unitLayout = { blocos, unidades };
}

const prisma = new PrismaClient();
try {
  if (await prisma.organization.findUnique({ where: { slug } })) fail("já existe organização com este slug");
  if (await prisma.organization.findUnique({ where: { protocolPrefix } })) fail("prefixo de protocolo já usado por outro condomínio");
  const plan = { slug, name, shortName, protocolPrefix, datajudTribunal, unidades: unitLayout?.unidades.length ?? "sem planta" };
  if (flag !== "--apply") {
    console.log("faria:", JSON.stringify(plan));
    console.log("rode com --apply para gravar");
  } else {
    const org = await prisma.organization.create({
      data: { slug, name, shortName, protocolPrefix, datajudTribunal, unitLayout: unitLayout ?? undefined },
      select: { id: true, slug: true },
    });
    // Configuração do portal da organização (nome oficial; CNPJ e endereço pela gestão).
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.organization_id', ${org.id}, TRUE)`;
      await tx.configPortal.create({ data: { organizationId: org.id, nomeCondominio: name, periodoAtivo: "" } });
    });
    console.log(`criada: ${org.slug} ${org.id}`);
  }
} finally {
  await prisma.$disconnect();
}
