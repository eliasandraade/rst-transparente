import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Semantic tokens (via CSS variables) ── */
        background:   "var(--background)",
        foreground:   "var(--foreground)",
        border:       "var(--border)",
        surface:      "var(--surface)",

        /* Aliases legados — mapeados para novos tokens */
        card: {
          DEFAULT:    "var(--surface)",
          foreground: "var(--foreground)",
        },
        muted: {
          DEFAULT:    "var(--surface-raised)",
          foreground: "var(--foreground-muted)",
        },

        /* Primary — escala mantida para `bg-primary/10` e similares */
        primary: {
          DEFAULT:    "#2F6FDB",
          foreground: "#FFFFFF",
          50:  "#EBF2FD",
          100: "#C8DFFB",
          200: "#91BDF6",
          300: "#5A9BF1",
          400: "#2F6FDB",
          500: "#2460C5",
          600: "#1A4EAA",
          700: "#113B8A",
          800: "#0A2A6A",
          900: "#051B4E",
        },

        /* Status */
        success: {
          DEFAULT:    "#16A34A",
          foreground: "#FFFFFF",
          light:      "#F0FDF4",  /* legado */
          subtle:     "#F0FDF4",
        },
        danger: {
          DEFAULT:    "#DC2626",
          foreground: "#FFFFFF",
          light:      "#FEF2F2",  /* legado */
          subtle:     "#FEF2F2",
        },
        warning: {
          DEFAULT:    "#D97706",
          foreground: "#92400E",
          light:      "#FFFBEB",  /* legado */
          subtle:     "#FFFBEB",
        },
      },

      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      fontSize: {
        xs:   ["0.75rem",   { lineHeight: "1.5" }],
        sm:   ["0.875rem",  { lineHeight: "1.5" }],
        base: ["1rem",      { lineHeight: "1.6" }],
        lg:   ["1.125rem",  { lineHeight: "1.6" }],
        xl:   ["1.25rem",   { lineHeight: "1.5" }],
        "2xl": ["1.5rem",   { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem",  { lineHeight: "1.2" }],
        "5xl": ["3rem",     { lineHeight: "1.1" }],
      },

      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl": "24px",
        full: "9999px",
      },

      spacing: {
        "4.5": "1.125rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "88":  "22rem",
        "112": "28rem",
        "128": "32rem",
      },

      boxShadow: {
        /* Cards */
        card:          "0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.03)",
        "card-hover":  "0 4px 16px rgb(0 0 0 / 0.08), 0 1px 4px rgb(0 0 0 / 0.04)",
        /* Elevação */
        sm:  "0 1px 2px rgb(0 0 0 / 0.05)",
        md:  "0 4px 8px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.04)",
        lg:  "0 8px 24px rgb(0 0 0 / 0.08), 0 2px 6px rgb(0 0 0 / 0.04)",
        xl:  "0 16px 48px rgb(0 0 0 / 0.10), 0 4px 12px rgb(0 0 0 / 0.06)",
        /* Foco */
        focus: "0 0 0 3px var(--primary-subtle)",
        /* Navbar */
        nav:   "0 1px 0 var(--border), 0 2px 8px rgb(0 0 0 / 0.04)",
      },

      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "out-expo":  "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out":    "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        "80":  "80ms",
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
      },

      maxWidth: {
        "8xl":  "88rem",
        content: "65ch",
      },

      height: {
        "header-brand": "3.5rem",   /* 56px — barra de identidade */
        "header-nav":   "2.75rem",  /* 44px — barra de navegação */
      },

      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "skeleton-shimmer": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },

      animation: {
        "page-enter":   "page-enter 350ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in":      "fade-in 300ms cubic-bezier(0.25, 1, 0.5, 1) both",
        "slide-in-left":"slide-in-left 250ms cubic-bezier(0.25, 1, 0.5, 1) both",
        "skeleton":     "skeleton-shimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
