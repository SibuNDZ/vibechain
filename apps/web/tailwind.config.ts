import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        barlow: ["var(--font-barlow)", "sans-serif"],
      },
      colors: {
        landing: {
          bg: "var(--landing-bg)",
          surface: "var(--landing-surface)",
          raised: "var(--landing-raised)",
          accent: "var(--landing-accent)",
          ink: "var(--landing-ink)",
          muted: "var(--landing-muted)",
        },
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        accent: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
      },
      boxShadow: {
        "landing-glow": "0 0 40px var(--landing-glow)",
      },
      backgroundImage: {
        "landing-cta":
          "linear-gradient(135deg, var(--landing-gradient-from), var(--landing-gradient-to))",
        "landing-wash":
          "radial-gradient(ellipse at 50% 0%, oklch(0.51 0.22 277 / 0.22), transparent 58%)",
      },
    },
  },
  plugins: [],
};

export default config;
