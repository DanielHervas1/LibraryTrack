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

export function verifyErrorMessage(error: AuthErrorLike): string {
  if (isRateLimited(error)) return "Demasiados intentos. Espera unos minutos.";
  if (error?.code === "otp_expired")
    return "El código ha caducado o no es correcto. Pide uno nuevo.";
  return "Código incorrecto. Revisa el correo y vuelve a intentarlo.";
}

/** "123 456" → "123456". Supabase usa códigos de 6 dígitos por defecto (configurable hasta 10). */
export function normalizeOtpCode(value: string): string | null {
  const digits = value.replace(/\s+/g, "");
  return /^\d{6,10}$/.test(digits) ? digits : null;
}
