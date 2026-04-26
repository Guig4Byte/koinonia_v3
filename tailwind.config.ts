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
        risk: { DEFAULT: "#934025", light: "#F6E5DC", border: "#DCAA96" },
        ok: { DEFAULT: "#456728", light: "#E7EFDA", border: "#BCCF9F" },
        warn: { DEFAULT: "#83530F", light: "#FAEED4", border: "#DAB36F" },
        new: { DEFAULT: "#2D618A", light: "#E3EEF6", border: "#B5CCDD" },
        stone: {
          50: "#FFFAF3",
          100: "#F3EADB",
          200: "#E4D4BD",
          300: "#D2BFA5",
          400: "#A9977E",
          500: "#655C51",
          600: "#554A40",
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
