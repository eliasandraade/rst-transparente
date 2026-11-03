import { staffSession } from "@/lib/staff";
import { orgRedirect } from "@/lib/org-server";

/**
 * Sessão válida neste condomínio vai direto ao painel. Token que o banco recusa
 * (conta desativada, removida ou de outro condomínio) fica no login, para entrar de novo.
 */
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  if (await staffSession()) return orgRedirect("/admin/dashboard");
  return children;
}
