import { describe, expect, it } from "vitest";

import { statusLabel, todayISO } from "./constants";

describe("todayISO", () => {
  it("usa la zona horaria de la app (Madrid), no UTC", () => {
    // 23:30 UTC del 1 de julio = 01:30 del 2 de julio en Madrid (UTC+2 en verano).
    expect(todayISO(new Date("2026-07-01T23:30:00Z"))).toBe("2026-07-02");
    expect(todayISO(new Date("2026-07-01T12:00:00Z"))).toBe("2026-07-01");
  });
});

describe("statusLabel", () => {
  it("adapta las etiquetas a libros", () => {
    expect(statusLabel("in_progress")).toBe("Viendo");
    expect(statusLabel("in_progress", "book")).toBe("Leyendo");
    expect(statusLabel("planned", "book")).toBe("Por leer");
    expect(statusLabel("completed", "book")).toBe("Completado");
  });
});
