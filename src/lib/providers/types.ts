import type { MediaType, Provider } from "@/lib/constants";

/** Resultado de búsqueda normalizado, igual para todas las APIs. */
export type MediaSearchResult = {
  provider: Provider;
  externalId: string;
  mediaType: MediaType;
  title: string;
  originalTitle: string | null;
  year: number | null;
  coverUrl: string | null;
  synopsis: string | null;
};

/** Datos completos para crear una entrada a partir de un resultado. */
export type MediaDetails = MediaSearchResult & {
  genres: string[];
  runtimeMinutes: number | null;
};

export interface MediaProvider {
  id: Exclude<Provider, "manual">;
  mediaTypes: MediaType[];
  search(query: string, mediaType: MediaType): Promise<MediaSearchResult[]>;
  getDetails(externalId: string, mediaType: MediaType): Promise<MediaDetails | null>;
}
