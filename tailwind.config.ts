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
        primary: {
          DEFAULT: "#2F6FDB",
          foreground: "#FFFFFF",
          50: "#EBF2FD",
          100: "#C8DFFB",
          200: "#91BDF6",
          300: "#5A9BF1",
          400: "#2F6FDB",
          500: "#1A54BF",
          600: "#0F3D99",
          700: "#082873",
          800: "#04164D",
          900: "#020927",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
          light: "#DCFCE7",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
          light: "#FEE2E2",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
          light: "#FEF3C7",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.2" }],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover":
          "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
