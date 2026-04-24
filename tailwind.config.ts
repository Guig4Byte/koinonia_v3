import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        risk: { DEFAULT: "#993C1D", light: "#FAECE7" },
        ok: { DEFAULT: "#3B6D11", light: "#EAF3DE" },
        warn: { DEFAULT: "#854F0B", light: "#FEF3E8" },
        new: { DEFAULT: "#185FA5", light: "#E6F1FB" },
        stone: {
          50: "#FAF9F7",
          100: "#F1EFEA",
          200: "#E3E0D8",
          300: "#D3D1C7",
          400: "#A8A59A",
          500: "#888780",
          600: "#5F5E5A",
          700: "#3D3C39",
          800: "#2C2C2A",
          900: "#1A1A18",
        },
      },
      fontSize: {
        pulse: ["1.5rem", { lineHeight: "1.4", fontWeight: "500" }],
        "card-title": ["1.125rem", { lineHeight: "1.3" }],
        "card-meta": ["0.875rem", { lineHeight: "1.4" }],
        badge: ["0.75rem", { lineHeight: "1", fontWeight: "500" }],
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "gentle-pulse": "gentlePulse 4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gentlePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(0.995)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
