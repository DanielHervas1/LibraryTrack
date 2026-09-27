import { describe, expect, it } from "vitest";

import {
  isRateLimited,
  sendErrorMessage,
  setPasswordErrorMessage,
  signInErrorMessage,
} from "./errors";

describe("isRateLimited", () => {
  it("detecta el 429 y los códigos de límite", () => {
    expect(isRateLimited({ status: 429 })).toBe(true);
    expect(isRateLimited({ code: "over_email_send_rate_limit" })).toBe(true);
    expect(isRateLimited({ code: "over_request_rate_limit" })).toBe(true);
    expect(isRateLimited({ status: 500 })).toBe(false);
    expect(isRateLimited(null)).toBe(false);
  });
});

describe("mensajes", () => {
  it("explican el límite de correos", () => {
    expect(sendErrorMessage({ status: 429 })).toMatch(/demasiados correos/);
    expect(sendErrorMessage({ status: 500 })).toMatch(/No se pudo enviar/);
  });

  it("el login no revela si falla el email o la contraseña", () => {
    expect(signInErrorMessage({ code: "invalid_credentials" })).toBe(
      "Email o contraseña incorrectos.",
    );
    expect(signInErrorMessage(null)).toBe("Email o contraseña incorrectos.");
    expect(signInErrorMessage({ status: 429 })).toMatch(/Demasiados intentos/);
  });

  it("traduce los errores al fijar contraseña", () => {
    expect(setPasswordErrorMessage({ code: "same_password" })).toMatch(/actual/);
    expect(setPasswordErrorMessage({ code: "weak_password" })).toMatch(/débil/);
    expect(setPasswordErrorMessage({ status: 500 })).toMatch(/No se pudo/);
  });
});
