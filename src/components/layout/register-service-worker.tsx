"use client";

import { useEffect } from "react";

/**
 * Registra el service worker. Solo en producción: en desarrollo interferiría con el
 * refresco en caliente y con ver los cambios al instante.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker", error);
    });
  }, []);

  return null;
}
