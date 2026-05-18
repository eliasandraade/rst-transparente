import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Identidade */}
          <div className="flex items-center gap-2.5">
            <Shield
              className="w-4 h-4 text-primary flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                Condomínio Residencial Santíssima Trindade
              </p>
              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                Informações publicadas pelo Conselho Fiscal
              </p>
            </div>
          </div>

          {/* Links e copyright */}
          <div className="flex flex-col sm:items-end gap-1.5">
            <nav aria-label="Links do rodapé">
              <ul className="flex items-center gap-4" role="list">
                <li>
                  <Link
                    href="/quem-somos"
                    className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors duration-150"
                    style={{ minHeight: "auto" }}
                  >
                    Quem Somos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demandas"
                    className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors duration-150"
                    style={{ minHeight: "auto" }}
                  >
                    Demandas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/login"
                    className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors duration-150"
                    style={{ minHeight: "auto" }}
                  >
                    Área Administrativa
                  </Link>
                </li>
              </ul>
            </nav>
            <p className="text-xs text-[var(--foreground-subtle)]">
              © {ano} Transparência RST
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
