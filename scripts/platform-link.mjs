/**
 * Liga um condomínio do COND à sua organização na Orken Platform (mesmo slug).
 * A organização é resolvida pela própria Platform, com o cliente de serviço do COND
 * (só aparece se o COND estiver habilitado nela): nenhum UUID digitado à mão.
 *
 *   node scripts/platform-link.mjs <slug>            # mostra o que faria
 *   node scripts/platform-link.mjs <slug> --apply    # grava
 *
 * Usa DATABASE_URL e as variáveis ORKEN_* do serviço (docs/orken-cond/identidade.md).
 */
import { PrismaClient } from "@prisma/client";

const [slug, flag] = process.argv.slice(2);
if (!slug || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) {
  console.error("uso: node scripts/platform-link.mjs <slug> [--apply]");
  process.exit(2);
}
for (const name of ["ORKEN_ISSUER", "PLATFORM_API_URL", "ORKEN_SERVICE_CLIENT_ID", "ORKEN_SERVICE_CLIENT_SECRET"]) {
  if (!process.env[name]) {
    console.error(`falta ${name}`);
    process.exit(2);
  }
}

const issuer = new URL(process.env.ORKEN_ISSUER).origin;
const discovery = await (await fetch(`${issuer}/.well-known/openid-configuration`)).json();
const basic = Buffer.from(
  `${encodeURIComponent(process.env.ORKEN_SERVICE_CLIENT_ID)}:${encodeURIComponent(process.env.ORKEN_SERVICE_CLIENT_SECRET)}`
).toString("base64");
const tokenRes = await fetch(discovery.token_endpoint, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basic}` },
  body: new URLSearchParams({ grant_type: "client_credentials", scope: "platform.tenancy.read" }),
});
if (!tokenRes.ok) {
  console.error(`token de serviço recusado (${tokenRes.status})`);
  process.exit(1);
}
const { access_token } = await tokenRes.json();
const tenantRes = await fetch(`${new URL(process.env.PLATFORM_API_URL).origin}/v1/tenants/by-slug/${slug}`, {
  headers: { authorization: `Bearer ${access_token}`, accept: "application/json" },
});
if (tenantRes.status === 404) {
  console.error("a Platform não mostra esta organização ao COND (inexistente ou sem o COND habilitado)");
  process.exit(1);
}
if (!tenantRes.ok) {
  console.error(`Platform respondeu ${tenantRes.status}`);
  process.exit(1);
}
const tenant = await tenantRes.json();
console.log(`Platform: ${tenant.slug} ${tenant.organizationId} (${tenant.displayName}, COND ${tenant.productStatus})`);

const prisma = new PrismaClient();
try {
  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true, platformOrganizationId: true } });
  if (!org) {
    console.error("o COND não tem organização com este slug");
    process.exit(1);
  }
  if (org.platformOrganizationId === tenant.organizationId) {
    console.log("já ligada; nada a fazer");
  } else if (flag !== "--apply") {
    console.log(`faria: ${slug} -> ${tenant.organizationId} (antes: ${org.platformOrganizationId ?? "sem vínculo"}); rode com --apply`);
  } else {
    await prisma.organization.update({ where: { id: org.id }, data: { platformOrganizationId: tenant.organizationId } });
    console.log(`ligada: ${slug} -> ${tenant.organizationId}`);
  }
} finally {
  await prisma.$disconnect();
}
