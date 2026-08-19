import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "finhash-theme";

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    preference === "system" ? systemTheme() : preference
  );

  useEffect(() => {
    const next = preference === "system" ? systemTheme() : preference;
    setResolved(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, preference);

    // Keep the browser/OS chrome in sync with the app surface.
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]:not([media])'
    );
    if (meta) meta.content = next === "dark" ? "#000000" : "#f6f5f3";
  }, [preference]);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const next = systemTheme();
      setResolved(next);
      document.documentElement.setAttribute("data-theme", next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = prev === "system" ? systemTheme() : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  return { theme: resolved, preference, setPreference, toggleTheme };
}
