import { describe, expect, it } from "vitest";

import {
  advancePages,
  describeProgress,
  finalPosition,
  isProgressComplete,
  nextEpisode,
  progressDelta,
  progressRatio,
  watchedEpisodes,
  type ProgressState,
} from "./progress";

const empty: Omit<ProgressState, "mediaType"> = {
  currentSeason: null,
  currentEpisode: null,
  totalEpisodes: null,
  currentPage: null,
  totalPages: null,
  seasons: null,
};

const breakingBad: ProgressState = {
  ...empty,
  mediaType: "tv",
  totalEpisodes: 20,
  seasons: [
    { number: 1, episodes: 7 },
    { number: 2, episodes: 13 },
  ],
};

describe("nextEpisode", () => {
  it("empieza por el episodio 1 de la primera temporada", () => {
    expect(nextEpisode(breakingBad)).toEqual({ season: 1, episode: 1 });
  });

  it("avanza dentro de la temporada", () => {
    expect(nextEpisode({ ...breakingBad, currentSeason: 1, currentEpisode: 3 })).toEqual({
      season: 1,
      episode: 4,
    });
  });

  it("salta a la siguiente temporada al acabar una", () => {
    expect(nextEpisode({ ...breakingBad, currentSeason: 1, currentEpisode: 7 })).toEqual({
      season: 2,
      episode: 1,
    });
  });

  it("devuelve null en el último episodio", () => {
    expect(nextEpisode({ ...breakingBad, currentSeason: 2, currentEpisode: 13 })).toBeNull();
  });

  it("anime: avanza hasta el total", () => {
    const anime: ProgressState = { ...empty, mediaType: "anime", totalEpisodes: 12 };
    expect(nextEpisode({ ...anime, currentEpisode: 5 })).toEqual({ season: null, episode: 6 });
    expect(nextEpisode({ ...anime, currentEpisode: 12 })).toBeNull();
  });

  it("sin total conocido, siempre puede avanzar", () => {
    expect(nextEpisode({ ...empty, mediaType: "anime", currentEpisode: 99 })).toEqual({
      season: null,
      episode: 100,
    });
  });
});

describe("watchedEpisodes y progressRatio", () => {
  it("suma las temporadas anteriores", () => {
    const state = { ...breakingBad, currentSeason: 2, currentEpisode: 3 };
    expect(watchedEpisodes(state)).toBe(10);
    expect(progressRatio(state)).toBe(0.5);
  });

  it("libros: página actual sobre total", () => {
    expect(progressRatio({ ...empty, mediaType: "book", currentPage: 184, totalPages: 736 })).toBe(
      0.25,
    );
  });

  it("null si no se conoce el total o es una película", () => {
    expect(progressRatio({ ...empty, mediaType: "anime", currentEpisode: 3 })).toBeNull();
    expect(progressRatio({ ...empty, mediaType: "movie" })).toBeNull();
  });
});

describe("isProgressComplete", () => {
  it("serie con temporadas: completa en el último episodio", () => {
    expect(isProgressComplete({ ...breakingBad, currentSeason: 2, currentEpisode: 13 })).toBe(true);
    expect(isProgressComplete({ ...breakingBad, currentSeason: 2, currentEpisode: 12 })).toBe(
      false,
    );
  });

  it("libro: completo al llegar a la última página", () => {
    const book: ProgressState = { ...empty, mediaType: "book", totalPages: 300 };
    expect(isProgressComplete({ ...book, currentPage: 300 })).toBe(true);
    expect(isProgressComplete({ ...book, currentPage: 299 })).toBe(false);
  });

  it("sin total nunca se considera completo", () => {
    expect(isProgressComplete({ ...empty, mediaType: "anime", currentEpisode: 50 })).toBe(false);
  });
});

describe("advancePages", () => {
  it("no se pasa del total", () => {
    const book: ProgressState = { ...empty, mediaType: "book", currentPage: 290, totalPages: 300 };
    expect(advancePages(book, 25)).toBe(300);
    expect(advancePages({ ...book, totalPages: null }, 25)).toBe(315);
  });
});

describe("finalPosition", () => {
  it("devuelve la última posición según el tipo", () => {
    expect(finalPosition(breakingBad)).toEqual({ current_season: 2, current_episode: 13 });
    expect(finalPosition({ ...empty, mediaType: "anime", totalEpisodes: 24 })).toEqual({
      current_episode: 24,
    });
    expect(finalPosition({ ...empty, mediaType: "book", totalPages: 500 })).toEqual({
      current_page: 500,
    });
    expect(finalPosition({ ...empty, mediaType: "movie" })).toEqual({});
  });
});

describe("describeProgress", () => {
  it("formatea cada tipo", () => {
    expect(describeProgress({ ...breakingBad, currentSeason: 2, currentEpisode: 5 })).toBe(
      "T2 · E5",
    );
    expect(
      describeProgress({ ...empty, mediaType: "anime", currentEpisode: 12, totalEpisodes: 28 }),
    ).toBe("Ep. 12 de 28");
    expect(
      describeProgress({ ...empty, mediaType: "book", currentPage: 120, totalPages: 736 }),
    ).toBe("Pág. 120 de 736");
    expect(describeProgress({ ...empty, mediaType: "book" })).toBeNull();
  });
});

describe("progressDelta", () => {
  it("cuenta episodios entre temporadas", () => {
    const before = { ...breakingBad, currentSeason: 1, currentEpisode: 6 };
    const after = { ...breakingBad, currentSeason: 2, currentEpisode: 2 };
    expect(progressDelta(before, after)).toEqual({ amount: 3, unit: "episode" });
  });

  it("cuenta páginas", () => {
    const book: ProgressState = { ...empty, mediaType: "book", currentPage: 100, totalPages: 300 };
    expect(progressDelta(book, { ...book, currentPage: 145 })).toEqual({
      amount: 45,
      unit: "page",
    });
  });

  it("ignora retrocesos, cambios nulos y películas", () => {
    const book: ProgressState = { ...empty, mediaType: "book", currentPage: 100 };
    expect(progressDelta(book, { ...book, currentPage: 90 })).toBeNull();
    expect(progressDelta(book, book)).toBeNull();
    expect(
      progressDelta({ ...empty, mediaType: "movie" }, { ...empty, mediaType: "movie" }),
    ).toBeNull();
  });
});
