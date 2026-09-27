import { describe, expect, it } from "vitest";

import { mapAnilistDetails, mapAnilistSearchItem, type AnilistMedia } from "./anilist-mappers";

const frieren: AnilistMedia = {
  id: 154587,
  title: {
    romaji: "Sousou no Frieren",
    english: "Frieren: Beyond Journey’s End",
    native: "葬送のフリーレン",
  },
  coverImage: { extraLarge: "https://s4.anilist.co/xl.jpg", large: "https://s4.anilist.co/l.jpg" },
  startDate: { year: 2023 },
  episodes: 28,
  duration: 24,
  genres: ["Adventure", "Drama", "Fantasy"],
  description: "The adventure is over.<br><br>Life goes on.<i></i> (Source: Crunchyroll)",
  studios: { nodes: [{ name: "Madhouse" }] },
};

describe("mapAnilistSearchItem", () => {
  it("usa el título inglés y guarda el romaji como original", () => {
    const result = mapAnilistSearchItem(frieren);
    expect(result.title).toBe("Frieren: Beyond Journey’s End");
    expect(result.originalTitle).toBe("Sousou no Frieren");
    expect(result.coverUrl).toBe("https://s4.anilist.co/xl.jpg");
    expect(result.authors).toEqual(["Madhouse"]);
  });

  it("usa el romaji si no hay título inglés", () => {
    const result = mapAnilistSearchItem({
      ...frieren,
      title: {
        romaji: "Sousou no Frieren 3rd Season",
        english: null,
        native: "葬送のフリーレン 第3期",
      },
    });
    expect(result.title).toBe("Sousou no Frieren 3rd Season");
    expect(result.originalTitle).toBe("葬送のフリーレン 第3期");
  });

  it("limpia HTML y la fuente de la sinopsis", () => {
    expect(mapAnilistSearchItem(frieren).synopsis).toBe("The adventure is over.\n\nLife goes on.");
  });
});

describe("mapAnilistDetails", () => {
  it("añade episodios, duración y géneros en español", () => {
    const details = mapAnilistDetails(frieren);
    expect(details.totalEpisodes).toBe(28);
    expect(details.episodeMinutes).toBe(24);
    expect(details.genres).toEqual(["Aventura", "Drama", "Fantasía"]);
  });

  it("trata episodios desconocidos como null (anime en emisión)", () => {
    expect(mapAnilistDetails({ ...frieren, episodes: null }).totalEpisodes).toBeNull();
  });
});
