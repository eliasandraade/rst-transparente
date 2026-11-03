import { requireStaff } from "@/lib/staff";
import AdminNav from "@/components/admin/AdminNav";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const { org } = await requireTenant();
  return {
    title: { absolute: `Gestão — ${org.shortName}`, template: `%s | Gestão — ${org.shortName}` },
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <div className="flex min-h-screen bg-[var(--surface-raised)]">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminNav userRole={session.user.role} />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <AdminMobileHeader userName={session.user.name} userRole={session.user.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Desenvolvido por{" "}
            <span className="font-medium">Andrade Systems</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
