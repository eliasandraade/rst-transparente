import { Suspense } from "react";
import type { Metadata } from "next";
import { requireTenant } from "@/lib/tenant";
import { orkenConfig } from "@/lib/orken/config";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const { org } = await requireTenant();
  // Botão da conta Orken só quando o COND está configurado e o condomínio tem a sua organização na Platform.
  const orkenEnabled = !!orkenConfig() && !!org.platformOrganizationId;
  return (
    <Suspense>
      <LoginForm orkenEnabled={orkenEnabled} />
    </Suspense>
  );
}
