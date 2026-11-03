import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const { org } = await requireTenant();
  return {
    title: { absolute: `Gestão — ${org.shortName}`, template: `%s | Gestão — ${org.shortName}` },
    robots: { index: false, follow: false },
  };
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
