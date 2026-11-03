"use client";

import { orgFetch, prefixOrgPath } from "@/lib/org-navigation";

/**
 * Saída da equipe: o servidor revoga a sessão e limpa os cookies; sessão do Orken ID
 * segue para o logout federado, as outras voltam ao login do condomínio.
 */
export async function signOutStaff(slug: string | null): Promise<void> {
  let endSessionUrl: string | null = null;
  try {
    const res = await orgFetch("/api/auth/logout", { method: "POST" });
    endSessionUrl = ((await res.json().catch(() => null)) as { endSessionUrl?: string | null } | null)?.endSessionUrl ?? null;
  } finally {
    window.location.assign(endSessionUrl ?? prefixOrgPath(slug, "/admin/login"));
  }
}
