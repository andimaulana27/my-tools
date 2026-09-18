"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current =
      document.documentElement.dataset.theme === "light" ||
      document.documentElement.dataset.theme === "dark"
        ? document.documentElement.dataset.theme
        : readTheme();
    applyTheme(current);
    setTheme(current);
  }, []);

  if (!theme) {
    return (
      <span className={className} aria-hidden>
        Theme
      </span>
    );
  }

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
