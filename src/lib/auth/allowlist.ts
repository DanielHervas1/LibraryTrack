/** Normaliza un email para compararlo (sin espacios, en minúsculas). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * La app es de un solo usuario: solo el email de ALLOWED_EMAIL puede iniciar sesión.
 * Si ALLOWED_EMAIL no está configurado, no se permite a nadie (falla cerrado).
 */
export function isAllowedEmail(
  email: string | null | undefined,
  allowed: string | undefined,
): boolean {
  if (!email || !allowed) return false;
  const normalizedAllowed = normalizeEmail(allowed);
  if (!normalizedAllowed) return false;
  return normalizeEmail(email) === normalizedAllowed;
}
