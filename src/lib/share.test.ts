import { describe, expect, it } from "vitest";

import { generateShareToken, isValidShareToken } from "./share";

describe("generateShareToken", () => {
  it("genera 43 caracteres base64url", () => {
    const token = generateShareToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isValidShareToken(token)).toBe(true);
  });

  it("no se repite", () => {
    const tokens = new Set(Array.from({ length: 100 }, generateShareToken));
    expect(tokens.size).toBe(100);
  });
});

describe("isValidShareToken", () => {
  it("rechaza tokens mal formados", () => {
    expect(isValidShareToken("corto")).toBe(false);
    expect(isValidShareToken("a".repeat(42) + "=")).toBe(false);
    expect(isValidShareToken("a".repeat(44))).toBe(false);
    expect(isValidShareToken(undefined)).toBe(false);
    expect(isValidShareToken(["a".repeat(43)])).toBe(false);
  });
});
