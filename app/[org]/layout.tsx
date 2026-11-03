import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import { OrganizationProvider } from "@/components/org/OrganizationProvider";

/** Portal e gestão de um condomínio: organização resolvida pelo caminho, ou 404 neutro. */
export async function generateMetadata(): Promise<Metadata> {
  const { org } = await requireTenant();
  return {
    // absolute: o título do condomínio não leva o sufixo do produto (layout raiz).
    title: { absolute: `Portal da Transparência — ${org.name}`, template: `%s | ${org.shortName}` },
    description: `Finanças, gestão e prestação de contas do ${org.name}.`,
  };
}

export default async function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const { org } = await requireTenant();
  return (
    <OrganizationProvider
      value={{ slug: org.slug, name: org.name, shortName: org.shortName, protocolPrefix: org.protocolPrefix }}
    >
      {children}
    </OrganizationProvider>
  );
}
