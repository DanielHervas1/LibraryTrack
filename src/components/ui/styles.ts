// Clases de Tailwind compartidas. Solo usan tokens de color (globals.css), nunca colores
// sueltos, así funcionan igual en tema claro y oscuro.
//
// Ojo: no combines estas clases con otra que fije la misma propiedad (p. ej. añadir
// "py-1" a inputClass). En Tailwind gana la que aparece después en el CSS, no en el
// string. Si necesitas otro tamaño, añade aquí una variante.

/** Base de campos de formulario: borde de control con contraste ≥ 3:1 (WCAG 1.4.11). */
const fieldBase =
  "rounded-lg border border-control bg-background text-foreground outline-none focus:ring-2 focus:ring-accent";

/** Campo de texto normal (ancho completo). */
export const inputClass = `w-full ${fieldBase} px-3 py-2`;

/** Campo de texto más bajo, para filas compactas (tags, géneros). */
export const smallInputClass = `w-full ${fieldBase} px-3 py-1.5 text-sm`;

/** Campo pequeño en línea (fechas sueltas, números cortos). */
export const compactInputClass = `${fieldBase} px-2 py-1 text-sm`;

/** Desplegable. */
export const selectClass = `${fieldBase} px-2 py-1.5 text-sm`;

export const primaryButtonClass =
  "rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

export const secondaryButtonClass =
  "rounded-lg border border-control px-3 py-1.5 text-sm text-foreground hover:bg-surface disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

/** Chip de filtro (tipo, estado, año…). */
export function chipClass(active: boolean): string {
  return `shrink-0 rounded-full border px-3 py-1 text-sm transition ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border text-muted hover:text-foreground"
  }`;
}
