import { describe, expect, it } from "vitest";

import {
  mapTmdbMovieDetails,
  mapTmdbMovieSearchItem,
  mapTmdbTvDetails,
  mapTmdbTvSearchItem,
  tmdbImageUrl,
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
      authors: [],
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
    expect(details.totalEpisodes).toBeNull();
  });

  it("usa la sinopsis de respaldo si falta en español", () => {
    const details = mapTmdbMovieDetails({ id: 1, title: "X", overview: "" }, "English overview");
    expect(details.synopsis).toBe("English overview");
  });

  it("trata runtime 0 como desconocido", () => {
    expect(mapTmdbMovieDetails({ id: 1, title: "X", runtime: 0 }).runtimeMinutes).toBeNull();
  });
});

describe("series", () => {
  it("normaliza un resultado de búsqueda de serie", () => {
    const result = mapTmdbTvSearchItem({
      id: 1396,
      name: "Breaking Bad",
      original_name: "Breaking Bad",
      first_air_date: "2008-01-20",
    });
    expect(result).toMatchObject({ mediaType: "tv", title: "Breaking Bad", year: 2008 });
  });

  it("extrae temporadas sin especiales, episodios y duración", () => {
    const details = mapTmdbTvDetails({
      id: 1396,
      name: "Breaking Bad",
      number_of_episodes: 62,
      episode_run_time: [],
      last_episode_to_air: { runtime: 56 },
      genres: [
        { id: 18, name: "Drama" },
        { id: 10765, name: "Sci-Fi & Fantasy" },
      ],
      seasons: [
        { season_number: 2, episode_count: 13 },
        { season_number: 0, episode_count: 9 },
        { season_number: 1, episode_count: 7 },
      ],
      created_by: [{ name: "Vince Gilligan" }],
    });
    expect(details.seasons).toEqual([
      { number: 1, episodes: 7 },
      { number: 2, episodes: 13 },
    ]);
    expect(details.totalEpisodes).toBe(62);
    expect(details.episodeMinutes).toBe(56);
    expect(details.genres).toEqual(["Drama", "Ciencia ficción", "Fantasía"]);
    expect(details.authors).toEqual(["Vince Gilligan"]);
  });

  it("calcula el total de episodios a partir de las temporadas si falta", () => {
    const details = mapTmdbTvDetails({
      id: 1,
      name: "X",
      seasons: [
        { season_number: 1, episode_count: 8 },
        { season_number: 2, episode_count: 10 },
      ],
    });
    expect(details.totalEpisodes).toBe(18);
    expect(details.episodeMinutes).toBeNull();
  });
});
