import { describe, expect, it } from "vitest";

import {
  mapTmdbMovieDetails,
  mapTmdbMovieSearchItem,
  tmdbImageUrl,
  yearFromDate,
} from "./tmdb-mappers";

describe("tmdbImageUrl", () => {
  it("construye la URL completa", () => {
    expect(tmdbImageUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(tmdbImageUrl("/abc.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/abc.jpg");
  });

  it("devuelve null sin ruta", () => {
    expect(tmdbImageUrl(null)).toBeNull();
    expect(tmdbImageUrl(undefined)).toBeNull();
  });
});

describe("yearFromDate", () => {
  it("extrae el año", () => {
    expect(yearFromDate("2021-09-15")).toBe(2021);
  });

  it("devuelve null con fechas vacías o inválidas", () => {
    expect(yearFromDate("")).toBeNull();
    expect(yearFromDate(undefined)).toBeNull();
    expect(yearFromDate("abcd")).toBeNull();
  });
});

describe("mapTmdbMovieSearchItem", () => {
  it("normaliza un resultado", () => {
    expect(
      mapTmdbMovieSearchItem({
        id: 438631,
        title: "Dune",
        original_title: "Dune",
        overview: "  En un lejano futuro…  ",
        poster_path: "/p.jpg",
        release_date: "2021-09-15",
      }),
    ).toEqual({
      provider: "tmdb",
      externalId: "438631",
      mediaType: "movie",
      title: "Dune",
      originalTitle: null,
      year: 2021,
      coverUrl: "https://image.tmdb.org/t/p/w500/p.jpg",
      synopsis: "En un lejano futuro…",
    });
  });

  it("conserva el título original si es distinto", () => {
    const result = mapTmdbMovieSearchItem({
      id: 1,
      title: "El viaje de Chihiro",
      original_title: "千と千尋の神隠し",
    });
    expect(result.originalTitle).toBe("千と千尋の神隠し");
    expect(result.coverUrl).toBeNull();
    expect(result.synopsis).toBeNull();
    expect(result.year).toBeNull();
  });
});

describe("mapTmdbMovieDetails", () => {
  it("añade géneros y duración", () => {
    const details = mapTmdbMovieDetails({
      id: 1,
      title: "Dune",
      overview: "Sinopsis",
      runtime: 155,
      genres: [
        { id: 878, name: "Ciencia ficción" },
        { id: 12, name: "Aventura" },
      ],
    });
    expect(details.genres).toEqual(["Ciencia ficción", "Aventura"]);
    expect(details.runtimeMinutes).toBe(155);
  });

  it("usa la sinopsis de respaldo si falta en español", () => {
    const details = mapTmdbMovieDetails({ id: 1, title: "X", overview: "" }, "English overview");
    expect(details.synopsis).toBe("English overview");
  });

  it("trata runtime 0 como desconocido", () => {
    expect(mapTmdbMovieDetails({ id: 1, title: "X", runtime: 0 }).runtimeMinutes).toBeNull();
  });
});
