import "server-only";

import {
  ANILIST_MEDIA_FIELDS,
  mapAnilistDetails,
  mapAnilistSearchItem,
  type AnilistMedia,
} from "./anilist-mappers";
import type { MediaProvider } from "./types";

const ANILIST_API = "https://graphql.anilist.co";

const SEARCH_QUERY = `
  query ($search: String) {
    Page(perPage: 20) {
      media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) { ${ANILIST_MEDIA_FIELDS} }
    }
  }
`;

const DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) { ${ANILIST_MEDIA_FIELDS} }
  }
`;

async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  // Lecturas públicas: no hace falta token.
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`AniList ${response.status}`);

  const body = (await response.json()) as { data?: T; errors?: { status?: number }[] };
  if (body.errors?.some((error) => error.status === 404)) return null;
  if (body.errors?.length) throw new Error(`AniList: ${JSON.stringify(body.errors)}`);
  return body.data ?? null;
}

export const anilistProvider: MediaProvider = {
  id: "anilist",
  mediaTypes: ["anime"],
  externalIdPattern: /^\d{1,10}$/,

  async search(query) {
    const data = await anilistFetch<{ Page: { media: AnilistMedia[] } }>(SEARCH_QUERY, {
      search: query,
    });
    return (data?.Page.media ?? []).map(mapAnilistSearchItem);
  },

  async getDetails(externalId) {
    const data = await anilistFetch<{ Media: AnilistMedia | null }>(DETAILS_QUERY, {
      id: Number(externalId),
    });
    return data?.Media ? mapAnilistDetails(data.Media) : null;
  },
};
