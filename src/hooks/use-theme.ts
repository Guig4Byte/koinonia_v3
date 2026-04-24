"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "koinonia-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
}

function apply(value: Theme) {
  const root = document.documentElement;
  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 6;

  let resolved: "light" | "dark";
  if (value === "dark") resolved = "dark";
  else if (value === "light") resolved = "light";
  else if (isNight) resolved = "dark";
  else resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  root.classList.toggle("dark", resolved === "dark");
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getStoredTheme,
    () => "system",
  );

  const setTheme = useCallback((value: Theme) => {
    localStorage.setItem(STORAGE_KEY, value);
    apply(value);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const toggleTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
