// Tema en el navegador: leer, cambiar y seguir los cambios. Solo se usa en componentes
// de cliente (accede a document, localStorage y matchMedia).

import {
  THEME_BACKGROUNDS,
  THEME_STORAGE_KEY,
  THEME_TRANSITION_MS,
  parseThemeChoice,
  resolveTheme,
  type ThemeChoice,
} from "./theme";

const CHANGE_EVENT = "librarytrack:themechange";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/** Elección actual. La pone el script de <head>, así que ya está disponible al hidratar. */
export function getThemeChoice(): ThemeChoice {
  return parseThemeChoice(document.documentElement.getAttribute("data-theme-choice"));
}

/** Sincroniza el color de la barra del navegador/PWA con el tema aplicado. */
function syncThemeColorMeta(theme: "light" | "dark") {
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.removeAttribute("media");
    meta.content = THEME_BACKGROUNDS[theme];
  }
}

/** Aplica una elección al documento. Con `animate`, transición breve de colores. */
export function applyTheme(choice: ThemeChoice, { animate = false } = {}) {
  const root = document.documentElement;
  const theme = resolveTheme(choice, systemPrefersDark());

  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), THEME_TRANSITION_MS + 60);
  }

  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-choice", choice);
  syncThemeColorMeta(theme);
}

/** Cambia y recuerda la elección (si localStorage no está disponible, dura la sesión). */
export function setThemeChoice(choice: ThemeChoice) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Modo privado o almacenamiento bloqueado: se aplica igualmente.
  }
  applyTheme(choice, { animate: true });
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Avisa de cualquier cambio: desde el selector, desde otra pestaña o del sistema operativo
 * (este último solo afecta en modo automático). Devuelve la función para dejar de escuchar.
 */
export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);

  const onSystemChange = () => {
    if (getThemeChoice() === "system") {
      applyTheme("system", { animate: true });
      onChange();
    }
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme(parseThemeChoice(event.newValue), { animate: true });
    onChange();
  };

  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
