// Reglas de contraseña. Funciones puras.

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt (lo que usa Supabase) ignora lo que pase de 72 bytes. */
export const PASSWORD_MAX_BYTES = 72;

/** Valida una contraseña nueva y su repetición. Devuelve el mensaje de error o null. */
export function checkNewPassword(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "La contraseña es demasiado larga (máximo 72 caracteres).";
  }
  if (password !== confirmation) return "Las contraseñas no coinciden.";
  return null;
}
