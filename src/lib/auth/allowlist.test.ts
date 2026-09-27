import { describe, expect, it } from "vitest";

import { isAllowedEmail, normalizeEmail } from "./allowlist";

describe("normalizeEmail", () => {
  it("quita espacios y pasa a minúsculas", () => {
    expect(normalizeEmail("  Yo@Ejemplo.COM ")).toBe("yo@ejemplo.com");
  });
});

describe("isAllowedEmail", () => {
  it("acepta el email permitido sin importar mayúsculas ni espacios", () => {
    expect(isAllowedEmail(" YO@ejemplo.com", "yo@ejemplo.com ")).toBe(true);
  });

  it("rechaza cualquier otro email", () => {
    expect(isAllowedEmail("otro@ejemplo.com", "yo@ejemplo.com")).toBe(false);
  });

  it("falla cerrado si ALLOWED_EMAIL no está configurado", () => {
    expect(isAllowedEmail("yo@ejemplo.com", undefined)).toBe(false);
    expect(isAllowedEmail("yo@ejemplo.com", "   ")).toBe(false);
  });

  it("rechaza emails vacíos", () => {
    expect(isAllowedEmail(null, "yo@ejemplo.com")).toBe(false);
    expect(isAllowedEmail("", "yo@ejemplo.com")).toBe(false);
  });
});
