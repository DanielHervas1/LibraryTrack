// Traducción de errores de Supabase Auth a mensajes para el usuario. Funciones puras.

type AuthErrorLike = { status?: number; code?: string } | null | undefined;

/** Supabase limita mucho los correos con su servicio por defecto (y los intentos seguidos). */
export function isRateLimited(error: AuthErrorLike): boolean {
  return (
    error?.status === 429 ||
    error?.code === "over_email_send_rate_limit" ||
    error?.code === "over_request_rate_limit"
  );
}

export function sendErrorMessage(error: AuthErrorLike): string {
  if (isRateLimited(error)) {
    return "Has pedido demasiados correos seguidos y Supabase los ha bloqueado un rato. Espera (puede ser hasta una hora) y vuelve a intentarlo una sola vez.";
  }
  return "No se pudo enviar el correo. Inténtalo de nuevo.";
}

/** Mismo mensaje para email desconocido y contraseña incorrecta: no revela cuál falla. */
export function signInErrorMessage(error: AuthErrorLike): string {
  if (isRateLimited(error)) return "Demasiados intentos. Espera unos minutos.";
  return "Email o contraseña incorrectos.";
}

export function setPasswordErrorMessage(error: AuthErrorLike): string {
  switch (error?.code) {
    case "same_password":
      return "Esa ya es tu contraseña actual.";
    case "weak_password":
      return "Contraseña demasiado débil. Usa una más larga o variada.";
    case "reauthentication_needed":
      return "Supabase pide volver a identificarte: cierra sesión, entra con el enlace por email y vuelve a intentarlo.";
    default:
      return isRateLimited(error)
        ? "Demasiados intentos. Espera unos minutos."
        : "No se pudo guardar la contraseña.";
  }
}
