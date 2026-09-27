import { describe, expect, it } from "vitest";

import { isRateLimited, normalizeOtpCode, sendErrorMessage, verifyErrorMessage } from "./errors";

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

  it("distinguen código caducado de incorrecto", () => {
    expect(verifyErrorMessage({ code: "otp_expired" })).toMatch(/caducado/);
    expect(verifyErrorMessage({ status: 400 })).toMatch(/incorrecto/);
  });
});

describe("normalizeOtpCode", () => {
  it("acepta 6-10 dígitos e ignora espacios", () => {
    expect(normalizeOtpCode("123 456")).toBe("123456");
    expect(normalizeOtpCode("12345678")).toBe("12345678");
  });

  it("rechaza lo demás", () => {
    expect(normalizeOtpCode("12345")).toBeNull();
    expect(normalizeOtpCode("12a456")).toBeNull();
    expect(normalizeOtpCode("")).toBeNull();
  });
});
