import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{jsx,tsx,mdx}",
    "./src/components/**/*.{jsx,tsx,mdx}",
    "./src/app/**/*.{jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        risk: { DEFAULT: "#9A3F25", light: "#F7E8DE" },
        ok: { DEFAULT: "#486B2A", light: "#E7EFDB" },
        warn: { DEFAULT: "#8A570F", light: "#FBEFD7" },
        new: { DEFAULT: "#2F638F", light: "#E4EEF6" },
        stone: {
          50: "#FFFAF2",
          100: "#F4EAD9",
          200: "#E5D7C2",
          300: "#D6C5AD",
          400: "#A9977E",
          500: "#72695E",
          600: "#5C5146",
          700: "#493824",
          800: "#2F2923",
          900: "#17130F",
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
