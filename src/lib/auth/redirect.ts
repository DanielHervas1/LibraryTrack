/**
 * Devuelve una ruta interna segura a la que redirigir tras el login.
 * Evita redirecciones abiertas: solo acepta rutas relativas que empiezan por "/"
 * (no "//" ni "/\", que el navegador interpreta como otro dominio).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
