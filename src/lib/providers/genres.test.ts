import { describe, expect, it } from "vitest";

import { normalizeAnilistGenres, normalizeBookGenres, normalizeTmdbTvGenres } from "./genres";

describe("normalizeTmdbTvGenres", () => {
  it("separa y traduce géneros combinados", () => {
    expect(normalizeTmdbTvGenres(["Sci-Fi & Fantasy", "Drama", "Action & Adventure"])).toEqual([
      "Ciencia ficción",
      "Fantasía",
      "Drama",
      "Acción",
      "Aventura",
    ]);
  });
});

describe("normalizeAnilistGenres", () => {
  it("traduce y conserva los desconocidos", () => {
    expect(normalizeAnilistGenres(["Sci-Fi", "Slice of Life", "Nuevo"])).toEqual([
      "Ciencia ficción",
      "Recuentos de la vida",
      "Nuevo",
    ]);
  });
});

describe("normalizeBookGenres", () => {
  it("interpreta categorías jerárquicas de Google Books", () => {
    expect(normalizeBookGenres(["Fiction / Fantasy / Epic", "Fiction / General"])).toEqual([
      "Fantasía",
    ]);
  });

  it("filtra subjects sueltos de Open Library", () => {
    expect(
      normalizeBookGenres(["orphans", "American fantasy fiction", "Magicians", "Science fiction"]),
    ).toEqual(["Fantasía", "Ciencia ficción"]);
  });

  it("limita el número de géneros", () => {
    expect(
      normalizeBookGenres(["Fantasy", "Horror", "Romance", "Poetry", "Humor"], 3),
    ).toHaveLength(3);
  });
});
