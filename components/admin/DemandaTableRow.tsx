"use client";

import { useRouter } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
}

export function DemandaTableRow({ href, children }: Props) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-[var(--surface-raised)] transition-colors duration-100 cursor-pointer"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(href)}
    >
      {children}
    </tr>
  );
}
