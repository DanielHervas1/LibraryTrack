import { describe, expect, it } from "vitest";

import { catalogHref, hasActiveFilters } from "./catalog-url";

describe("catalogHref", () => {
  it("sin filtros devuelve la ruta base", () => {
    expect(catalogHref({ sort: "recent" })).toBe("/");
  });

  it("serializa todos los filtros y omite el orden por defecto", () => {
    expect(
      catalogHref({
        sort: "score",
        query: "dune",
        mediaType: "movie",
        status: "completed",
        genre: "Ciencia ficción",
        tag: "infravalorada",
        favorites: true,
      }),
    ).toBe(
      "/?q=dune&type=movie&status=completed&genre=Ciencia+ficci%C3%B3n&tag=infravalorada&fav=1&sort=score",
    );
  });

  it("acepta otra ruta base", () => {
    expect(catalogHref({ sort: "recent", mediaType: "book" }, "/favorites")).toBe(
      "/favorites?type=book",
    );
  });
});

describe("hasActiveFilters", () => {
  it("el orden no cuenta como filtro", () => {
    expect(hasActiveFilters({ sort: "title" })).toBe(false);
    expect(hasActiveFilters({ sort: "recent", genre: "Drama" })).toBe(true);
  });
});
