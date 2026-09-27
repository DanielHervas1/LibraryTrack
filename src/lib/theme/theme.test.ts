import { describe, expect, it } from "vitest";

import {
  THEME_STORAGE_KEY,
  nextThemeChoice,
  parseThemeChoice,
  resolveTheme,
  themeInitScript,
} from "./theme";

describe("parseThemeChoice", () => {
  it("acepta light/dark y cae a system con cualquier otra cosa", () => {
    expect(parseThemeChoice("light")).toBe("light");
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice("system")).toBe("system");
    expect(parseThemeChoice(null)).toBe("system");
    expect(parseThemeChoice("morado")).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("respeta la elección manual y sigue al sistema en automático", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("nextThemeChoice", () => {
  it("rota Automático → Claro → Oscuro → Automático", () => {
    expect(nextThemeChoice("system")).toBe("light");
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("system");
  });
});

/** Ejecuta el script de <head> con un navegador simulado y devuelve los atributos puestos. */
function runInitScript({
  stored,
  systemDark,
  storageThrows = false,
}: {
  stored: string | null;
  systemDark: boolean;
  storageThrows?: boolean;
}) {
  const attributes: Record<string, string> = {};
  const fakeWindow = {
    matchMedia: (query: string) => ({ matches: query.includes("dark") && systemDark }),
  };
  const fakeDocument = {
    documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) },
  };
  const fakeStorage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error("bloqueado");
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };
  new Function("window", "document", "localStorage", themeInitScript)(
    fakeWindow,
    fakeDocument,
    fakeStorage,
  );
  return attributes;
}

describe("themeInitScript (se ejecuta antes del primer pintado)", () => {
  it("aplica la elección guardada", () => {
    expect(runInitScript({ stored: "dark", systemDark: false })).toEqual({
      "data-theme": "dark",
      "data-theme-choice": "dark",
    });
    expect(runInitScript({ stored: "light", systemDark: true })["data-theme"]).toBe("light");
  });

  it("sin elección, sigue al sistema", () => {
    expect(runInitScript({ stored: null, systemDark: true })).toEqual({
      "data-theme": "dark",
      "data-theme-choice": "system",
    });
  });

  it("con valores raros o sin acceso a localStorage, usa el sistema sin romperse", () => {
    expect(runInitScript({ stored: "morado", systemDark: false })["data-theme"]).toBe("light");
    expect(runInitScript({ stored: "dark", systemDark: true, storageThrows: true })).toEqual({
      "data-theme": "dark",
      "data-theme-choice": "system",
    });
  });
});
