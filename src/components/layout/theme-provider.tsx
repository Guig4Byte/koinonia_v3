"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    // Reaplica quando o tema muda via hook
    const apply = () => {
      const root = document.documentElement;
      const stored = localStorage.getItem("koinonia-theme") as "light" | "dark" | "system" | null;
      const hour = new Date().getHours();
      const isNight = hour >= 21 || hour < 6;

      let resolved: "light" | "dark";
      if (stored === "dark") resolved = "dark";
      else if (stored === "light") resolved = "light";
      else if (isNight) resolved = "dark";
      else resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

      root.classList.toggle("dark", resolved === "dark");
    };

    apply();
  }, [theme]);

  return <>{children}</>;
}
