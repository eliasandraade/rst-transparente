import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenant";

/** Caminho no condomínio da requisição: "/admin/x" → "/{slug}/admin/x". */
export async function orgPath(path: string): Promise<string> {
  const { org } = await requireTenant();
  return path === "/" ? `/${org.slug}` : `/${org.slug}${path}`;
}

/** redirect() dentro do condomínio da requisição (páginas do servidor). */
export async function orgRedirect(path: string): Promise<never> {
  redirect(await orgPath(path));
}
