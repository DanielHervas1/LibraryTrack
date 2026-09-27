"use client";

import { useState } from "react";

/**
 * Estado local editable que se resetea cuando cambia el valor que llega del servidor
 * (p. ej. el estado de una entrada que otra acción ha cambiado). Patrón recomendado por
 * React para "ajustar estado cuando cambia una prop", sin useEffect.
 */
export function useSyncedState<T>(value: T) {
  const [state, setState] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (!Object.is(value, previous)) {
    setPrevious(value);
    setState(value);
  }
  return [state, setState] as const;
}
