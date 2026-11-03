/**
 * Organização no caminho (`/{slug}/...`), sem dependência de servidor: vale no
 * middleware (runtime Edge) e no resto do app. lib/tenant.ts resolve o slug.
 */

export const ORGANIZATION_HEADER = "x-cond-organization";
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** Caminhos do próprio produto: nunca slug de condomínio. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "api", "admin", "entrar", "sair", "orken", "static", "assets", "health", "login", "www", "cond", "_next",
  "favicon.ico", "robots.txt", "sitemap.xml",
]);

export function isOrganizationSlug(value: string | undefined | null): value is string {
  return !!value && SLUG_PATTERN.test(value) && !RESERVED_SLUGS.has(value);
}
