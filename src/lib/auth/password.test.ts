import { describe, expect, it } from "vitest";

import { checkNewPassword } from "./password";

describe("checkNewPassword", () => {
  it("acepta una contraseña válida repetida igual", () => {
    expect(checkNewPassword("una-frase-larga", "una-frase-larga")).toBeNull();
  });

  it("exige un mínimo de 8 caracteres", () => {
    expect(checkNewPassword("corta", "corta")).toMatch(/al menos 8/);
  });

  it("rechaza más de 72 bytes (límite de bcrypt), contando acentos como 2 bytes", () => {
    expect(checkNewPassword("a".repeat(73), "a".repeat(73))).toMatch(/demasiado larga/);
    expect(checkNewPassword("é".repeat(37), "é".repeat(37))).toMatch(/demasiado larga/);
    expect(checkNewPassword("a".repeat(72), "a".repeat(72))).toBeNull();
  });

  it("detecta que no coinciden", () => {
    expect(checkNewPassword("una-frase-larga", "otra-frase-larga")).toMatch(/no coinciden/);
  });
});
