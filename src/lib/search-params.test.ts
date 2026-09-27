import { describe, expect, it } from "vitest";

import {
  parseCatalogFilters,
  parseMediaType,
  parseSort,
  parseStatus,
  parseText,
  toIlikePattern,
} from "./search-params";

describe("parsers", () => {
  it("aceptan solo valores conocidos", () => {
    expect(parseMediaType("book")).toBe("book");
    expect(parseMediaType("podcast")).toBeUndefined();
    expect(parseStatus("paused")).toBe("paused");
    expect(parseStatus(["paused"])).toBeUndefined();
    expect(parseSort("score")).toBe("score");
    expect(parseSort("hack")).toBe("recent");
  });

  it("parseText recorta y descarta vacíos", () => {
    expect(parseText("  dune ")).toBe("dune");
    expect(parseText("   ")).toBeUndefined();
    expect(parseText("x".repeat(200), 10)).toHaveLength(10);
    expect(parseText(undefined)).toBeUndefined();
  });
});

describe("toIlikePattern", () => {
  it("envuelve en comodines", () => {
    expect(toIlikePattern("dune")).toBe("%dune%");
  });

  it("escapa comodines de LIKE", () => {
    expect(toIlikePattern("100%_real")).toBe("%100\\%\\_real%");
  });

  it("quita caracteres de la sintaxis de filtros de PostgREST", () => {
    expect(toIlikePattern("a,b(c)")).toBe("%a b c%");
  });
});

describe("parseCatalogFilters", () => {
  it("lee todos los filtros y descarta valores inválidos", () => {
    expect(
      parseCatalogFilters({
        type: "anime",
        status: "nope",
        sort: "title",
        q: " frieren ",
        genre: "Fantasía",
        tag: ["a", "b"],
        fav: "1",
      }),
    ).toEqual({
      mediaType: "anime",
      status: undefined,
      sort: "title",
      query: "frieren",
      genre: "Fantasía",
      tag: undefined,
      favorites: true,
    });
  });
});
