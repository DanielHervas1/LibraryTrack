"use client";

import { useEffect } from "react";

import { applyTheme, getThemeChoice, subscribeTheme } from "@/lib/theme/client";

/**
 * Montado una vez en el layout raíz: ajusta el color de la barra del navegador al tema
 * aplicado y sigue los cambios del sistema operativo y de otras pestañas en cualquier
 * pantalla, esté o no visible el selector.
 */
export function ThemeSync() {
  useEffect(() => {
    applyTheme(getThemeChoice());
    return subscribeTheme(() => {});
  }, []);

  return null;
}
