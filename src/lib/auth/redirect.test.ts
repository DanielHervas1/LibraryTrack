import { describe, expect, it } from "vitest";

import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/entry/123?tab=review")).toBe("/entry/123?tab=review");
  });

  it("usa el fallback si no hay ruta", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("", "/stats")).toBe("/stats");
  });

  it("rechaza URLs absolutas y protocol-relative", () => {
    expect(safeNextPath("https://malicioso.com")).toBe("/");
    expect(safeNextPath("//malicioso.com")).toBe("/");
    expect(safeNextPath("/\\malicioso.com")).toBe("/");
  });
});
