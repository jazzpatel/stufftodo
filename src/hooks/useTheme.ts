import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("tf-theme");
      if (saved) return saved === "dark";
    } catch {
      /* ignore SSR / private browsing */
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("tf-theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
