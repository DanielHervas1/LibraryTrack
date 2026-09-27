// Token del perfil compartido: 32 bytes aleatorios en base64url (43 caracteres).
// Es la única "llave" del enlace, así que se genera con el generador criptográfico.

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateShareToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
}

/** Filtra tokens mal formados antes de consultar la base de datos. */
export function isValidShareToken(token: unknown): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}
