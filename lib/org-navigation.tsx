"use client";

/**
 * Navegação dentro do portal de um condomínio (docs/orken-cond/arquitetura.md).
 * Toda página de condomínio vive em `/{slug}/...`; estes substitutos de Link,
 * useRouter, usePathname e fetch prefixam (ou removem) o slug DA PÁGINA, para os
 * componentes seguirem escrevendo caminhos como "/admin/avisos" e "/api/avisos".
 * O servidor resolve a organização de novo, pelo caminho, em cada requisição.
 */

import NextLink from "next/link";
import { useParams, usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { forwardRef, type ComponentProps } from "react";

/** Slug do condomínio da página (`/{slug}/...`), ou null fora de um condomínio. */
export function useOrgSlug(): string | null {
  const params = useParams<{ org?: string }>();
  return typeof params?.org === "string" ? params.org : null;
}

/** "/admin/x" → "/{slug}/admin/x"; externos, âncoras e caminhos já prefixados ficam como estão. */
export function prefixOrgPath(slug: string | null, href: string): string {
  if (!slug || !href.startsWith("/") || href.startsWith("//")) return href;
  if (href === `/${slug}` || href.startsWith(`/${slug}/`) || href.startsWith(`/${slug}?`) || href.startsWith(`/${slug}#`)) return href;
  return href === "/" ? `/${slug}` : `/${slug}${href}`;
}

type LinkProps = ComponentProps<typeof NextLink>;

/** Link do portal: caminhos absolutos ganham o slug do condomínio da página. */
const OrgLink = forwardRef<HTMLAnchorElement, LinkProps>(function OrgLink({ href, ...props }, ref) {
  const slug = useOrgSlug();
  const target = typeof href === "string" ? prefixOrgPath(slug, href) : href;
  return <NextLink ref={ref} href={target} {...props} />;
});
export default OrgLink;

/** useRouter com push/replace/prefetch no condomínio da página. */
export function useOrgRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter();
  const slug = useOrgSlug();
  return {
    ...router,
    push: (href, options) => router.push(prefixOrgPath(slug, href), options),
    replace: (href, options) => router.replace(prefixOrgPath(slug, href), options),
    prefetch: (href, options) => router.prefetch(prefixOrgPath(slug, href), options),
  };
}

/** usePathname sem o slug: "/{slug}/admin/x" → "/admin/x" (estado ativo de menus etc.). */
export function useOrgPathname(): string {
  const pathname = useNextPathname() ?? "/";
  const slug = useOrgSlug();
  if (!slug) return pathname;
  if (pathname === `/${slug}`) return "/";
  return pathname.startsWith(`/${slug}/`) ? pathname.slice(slug.length + 1) : pathname;
}

/**
 * fetch do portal: "/api/x" vira "/{slug}/api/x", com o slug lido do caminho da
 * página no momento da chamada (só em evento ou efeito, nunca durante o render).
 */
export function orgFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const slug = window.location.pathname.split("/")[1];
    if (!slug) return Promise.reject(new Error("fora do portal de um condomínio"));
    return fetch(`/${slug}${input}`, init);
  }
  return fetch(input, init);
}
