import { describe, expect, it } from "vitest";

import {
  cleanOpenLibraryDescription,
  googleBooksCoverUrl,
  mapGoogleBooksDetails,
  mapOpenLibraryDetails,
  mapOpenLibraryDoc,
  type OpenLibraryDoc,
} from "./books-mappers";

describe("Google Books", () => {
  it("pasa las portadas a https y quita el efecto curl", () => {
    expect(
      googleBooksCoverUrl({
        thumbnail:
          "http://books.google.com/books/content?id=X&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      }),
    ).toBe(
      "https://books.google.com/books/content?id=X&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    );
    expect(googleBooksCoverUrl(undefined)).toBeNull();
  });

  it("normaliza un volumen", () => {
    const details = mapGoogleBooksDetails({
      id: "abc123XYZ",
      volumeInfo: {
        title: "El nombre del viento",
        authors: ["Patrick Rothfuss"],
        publishedDate: "2009-03",
        description: "<p>Una <b>historia</b></p>",
        pageCount: 880,
        categories: ["Fiction / Fantasy / Epic"],
      },
    });
    expect(details).toMatchObject({
      provider: "google_books",
      mediaType: "book",
      title: "El nombre del viento",
      year: 2009,
      synopsis: "Una historia",
      authors: ["Patrick Rothfuss"],
      genres: ["Fantasía"],
      totalPages: 880,
      totalEpisodes: null,
    });
  });
});

describe("Open Library", () => {
  const doc: OpenLibraryDoc = {
    key: "/works/OL8479867W",
    title: "The Name of the Wind",
    author_name: ["Patrick Rothfuss"],
    first_publish_year: 2007,
    cover_i: 11480483,
    number_of_pages_median: 736,
    subject: ["orphans", "American fantasy fiction"],
    editions: { docs: [{ title: "El nombre del viento", cover_i: 15234772 }] },
  };

  it("prefiere el título y la portada de la edición en español", () => {
    expect(mapOpenLibraryDoc(doc)).toEqual({
      provider: "open_library",
      externalId: "OL8479867W",
      mediaType: "book",
      title: "El nombre del viento",
      originalTitle: "The Name of the Wind",
      year: 2007,
      coverUrl: "https://covers.openlibrary.org/b/id/15234772-L.jpg",
      synopsis: null,
      authors: ["Patrick Rothfuss"],
    });
  });

  it("usa los datos de la obra si no hay edición", () => {
    const result = mapOpenLibraryDoc({ ...doc, editions: { docs: [] } });
    expect(result.title).toBe("The Name of the Wind");
    expect(result.originalTitle).toBeNull();
    expect(result.coverUrl).toBe("https://covers.openlibrary.org/b/id/11480483-L.jpg");
  });

  it("combina ficha y obra", () => {
    const details = mapOpenLibraryDetails(doc, {
      description: {
        value: "***The Name of the Wind*** is a novel ([source][1]).\n\n[1]: https://x.org",
      },
      subjects: ["Fantasy", "Magic"],
    });
    expect(details.synopsis).toBe("The Name of the Wind is a novel .");
    expect(details.genres).toEqual(["Fantasía"]);
    expect(details.totalPages).toBe(736);
  });

  it("limpia enlaces markdown en la descripción", () => {
    expect(cleanOpenLibraryDescription("Ver [la saga](https://x.org) completa")).toBe(
      "Ver la saga completa",
    );
    expect(cleanOpenLibraryDescription(undefined)).toBeNull();
  });
});
