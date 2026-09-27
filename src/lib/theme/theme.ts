// Tema claro / oscuro / automático. Lógica pura compartida por servidor y cliente.
//
// Cómo funciona:
// - La elección del usuario ("light" | "dark" | "system") se guarda en localStorage.
// - Un script en <head> (themeInitScript) resuelve el tema ANTES del primer pintado y
//   pone <html data-theme="light|dark" data-theme-choice="…">: así no hay parpadeo.
// - globals.css define todos los colores como variables en :root (claro) y
//   :root[data-theme="dark"] (oscuro). Los componentes solo usan esas variables.

export const THEME_STORAGE_KEY = "librarytrack-theme";

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type ResolvedTheme = "light" | "dark";

export const THEME_LABELS: Record<ThemeChoice, string> = {
  system: "Automático",
  light: "Claro",
  dark: "Oscuro",
};

/** Fondo de cada tema: color de la barra del navegador (meta theme-color). Igual que --background. */
export const THEME_BACKGROUNDS: Record<ResolvedTheme, string> = {
  light: "#ffffff",
  dark: "#0b0b0f",
};

/** Acento de marca (el --accent del tema claro): manifest de la PWA, que no admite variables. */
export const BRAND_ACCENT = "#4f46e5";

/** Duración de la transición al cambiar de tema (debe coincidir con globals.css). */
export const THEME_TRANSITION_MS = 180;

export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme {
  if (choice === "system") return systemPrefersDark ? "dark" : "light";
  return choice;
}

/** Orden del botón: Automático → Claro → Oscuro → Automático… */
export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return THEME_CHOICES[(THEME_CHOICES.indexOf(choice) + 1) % THEME_CHOICES.length];
}

/**
 * Script bloqueante para <head>. Replica parseThemeChoice + resolveTheme en JS plano
 * (se ejecuta antes de que cargue React). Si localStorage falla (modo privado), usa el
 * tema del sistema.
 */
export const themeInitScript = `(function(){var c="system";try{c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||"system"}catch(e){}if(c!=="light"&&c!=="dark")c="system";var d=c==="dark"||(c==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.setAttribute("data-theme",d?"dark":"light");r.setAttribute("data-theme-choice",c)})()`;
