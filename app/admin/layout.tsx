import { auth } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Área Administrativa",
    template: "%s | Admin — Portal da Transparência",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Página de login não usa esse layout
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        <AdminNav userRole={session.user.role} />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <AdminMobileHeader userName={session.user.name} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
