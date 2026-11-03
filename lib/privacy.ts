import { createHmac } from "node:crypto";

/**
 * Minimização de dados pessoais (docs/orken-cond/lgpd.md). O IP serve para impedir
 * voto repetido e investigar abuso, não para identificar a pessoa: fica guardado
 * como HMAC por organização (o mesmo IP gera valores diferentes em condomínios
 * diferentes, e sem a chave não volta ao IP). Chave em `IP_HASH_SECRET`.
 */

const PREFIX = "h1:";

function secret(): string {
  const value = process.env.IP_HASH_SECRET ?? "";
  if (value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new Error("IP_HASH_SECRET ausente ou curto");
  return "desenvolvimento-sem-segredo-configurado-0000";
}

/** Pseudônimo do IP nesta organização ("h1:<base64url>"); "unknown" fica como está. */
export function pseudonymizeIp(organizationId: string, ip: string): string {
  if (ip === "unknown") return ip;
  return PREFIX + createHmac("sha256", secret()).update(`${organizationId}:${ip}`).digest("base64url");
}

/** Resumo de erro para log: tipo e código, nunca a mensagem (o Prisma põe dados da consulta nela). */
export function errorSummary(error: unknown): string {
  if (error && typeof error === "object") {
    const { name, code } = error as { name?: unknown; code?: unknown };
    return [typeof name === "string" ? name : "Error", typeof code === "string" ? code : null].filter(Boolean).join(" ");
  }
  return "erro";
}
