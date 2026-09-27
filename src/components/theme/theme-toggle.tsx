"use client";

import { useSyncExternalStore } from "react";

import { getThemeChoice, setThemeChoice, subscribeTheme } from "@/lib/theme/client";
import { THEME_LABELS, nextThemeChoice, type ThemeChoice } from "@/lib/theme/theme";

const ICONS: Record<ThemeChoice, string> = {
  // Sol
  light:
    "M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  // Luna
  dark: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z",
  // Monitor (automático: sigue al sistema)
  system: "M3 5h18v11H3zM8 20h8M12 16v4",
};

/**
 * Botón de tema: Automático → Claro → Oscuro. El valor real solo existe en el navegador
 * (lo puso el script de <head>), así que en el servidor se pinta un hueco del mismo tamaño
 * para no provocar diferencias de hidratación.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const choice = useSyncExternalStore<ThemeChoice | null>(
    subscribeTheme,
    getThemeChoice,
    () => null,
  );

  if (!choice) return <span aria-hidden="true" className={`inline-block size-10 ${className}`} />;

  const next = nextThemeChoice(choice);
  const label = `Tema: ${THEME_LABELS[choice].toLowerCase()}. Pulsa para cambiar a ${THEME_LABELS[next].toLowerCase()}.`;

  return (
    <button
      type="button"
      onClick={() => setThemeChoice(next)}
      aria-label={label}
      title={label}
      className={`flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={ICONS[choice]} />
      </svg>
    </button>
  );
}
