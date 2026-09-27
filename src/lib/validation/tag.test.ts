import { describe, expect, it } from "vitest";

import { tagNameSchema } from "./tag";

describe("tagNameSchema", () => {
  it("normaliza espacios", () => {
    expect(tagNameSchema.parse("  para   ver con amigos ")).toBe("para ver con amigos");
  });

  it("rechaza vacíos y demasiado largos", () => {
    expect(tagNameSchema.safeParse("   ").success).toBe(false);
    expect(tagNameSchema.safeParse("x".repeat(41)).success).toBe(false);
  });
});
