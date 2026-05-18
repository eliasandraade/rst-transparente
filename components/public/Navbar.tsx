"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { LogIn, Menu, X, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/financeiro",  label: "Receitas e Despesas" },
  { href: "/metricas",    label: "Métricas" },
  { href: "/parecer",     label: "Parecer" },
  { href: "/avisos",      label: "Avisos" },
  { href: "/gestao",      label: "Gestão" },
  { href: "/demandas",    label: "Central de Demandas" },
  { href: "/quem-somos",  label: "Quem Somos" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Detectar scroll para shadow no header */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Fechar drawer ao navegar */
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  /* Travar scroll do body quando drawer aberto */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    if (drawerOpen) closeRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  /* ESC fecha o drawer */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    if (drawerOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-shadow duration-200",
          scrolled && "shadow-nav"
        )}
      >
        {/* ── Barra de identidade ── */}
        <div className="bg-primary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="Início — Transparência RST"
              style={{ minHeight: "auto" }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors duration-150">
                <Shield className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="font-semibold text-white text-[0.9375rem] leading-tight tracking-[-0.01em]">
                  Transparência RST
                </div>
                <div className="text-white/60 text-[0.6875rem] leading-tight hidden sm:block">
                  Condomínio Residencial Santíssima Trindade
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-0.5">
              <ThemeToggle
                className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150"
                style={{ minHeight: "auto" }}
              />
              <Link
                href="/admin/login"
                className="hidden sm:flex items-center gap-1.5 text-[0.8125rem] font-medium text-white/70 hover:text-white transition-colors duration-150 px-3 py-2 rounded-md hover:bg-white/10"
                style={{ minHeight: "auto" }}
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                Entrar
              </Link>
              <button
                className="sm:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150"
                style={{ minHeight: "auto" }}
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu de navegação"
                aria-expanded={drawerOpen}
                aria-controls="mobile-drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Navegação desktop ── */}
        <nav
          className="hidden sm:block bg-surface border-b border-border"
          aria-label="Navegação principal"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ul className="flex" role="list">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href + "/"));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{ minHeight: "auto" }}
                      className={cn(
                        "relative inline-flex items-center px-3.5 py-3 text-[0.8125rem] font-medium transition-colors duration-150",
                        "after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:rounded-full after:transition-colors after:duration-150",
                        active
                          ? "text-primary after:bg-primary"
                          : "text-[var(--foreground-muted)] hover:text-foreground after:bg-transparent"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* ── Drawer mobile ─────────────────────────────────────────────── */}

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 sm:hidden",
          "transition-opacity duration-250",
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Painel lateral */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        style={{ transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)" }}
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-72 sm:hidden",
          "flex flex-col bg-surface shadow-xl",
          "transition-transform duration-250",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
            <span className="font-semibold text-sm text-foreground tracking-[-0.01em]">
              Transparência RST
            </span>
          </div>
          <button
            ref={closeRef}
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors duration-150"
            style={{ minHeight: "auto" }}
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Navegação mobile">
          <ul role="list">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href + "/"));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150",
                      "border-l-2",
                      active
                        ? "text-primary bg-[var(--primary-subtle)] border-primary"
                        : "text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] border-transparent"
                    )}
                    aria-current={active ? "page" : undefined}
                    style={{ minHeight: "auto" }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Rodapé do drawer */}
        <div className="border-t border-border p-3">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--foreground-muted)] hover:text-foreground hover:bg-[var(--surface-raised)] transition-colors duration-150"
            style={{ minHeight: "auto" }}
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            Área administrativa
          </Link>
        </div>
      </div>
    </>
  );
}
