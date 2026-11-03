"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Identidade pública do condomínio da página (o que o portal mostra; nada sensível). */
export interface PublicOrganization {
  slug: string;
  name: string;
  shortName: string;
  protocolPrefix: string;
}

const OrganizationContext = createContext<PublicOrganization | null>(null);

export function OrganizationProvider({ value, children }: { value: PublicOrganization; children: ReactNode }) {
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

/** Condomínio da página; só existe dentro de `/{slug}/...`. */
export function useOrganization(): PublicOrganization {
  const organization = useContext(OrganizationContext);
  if (!organization) throw new Error("useOrganization fora de um condomínio");
  return organization;
}
