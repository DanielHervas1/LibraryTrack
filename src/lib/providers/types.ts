import type { MediaType, Provider } from "@/lib/constants";

export type ExternalProvider = Exclude<Provider, "manual">;

/** Resultado de búsqueda normalizado, igual para todas las APIs. */
export type MediaSearchResult = {
  provider: ExternalProvider;
  externalId: string;
  mediaType: MediaType;
  title: string;
  originalTitle: string | null;
  year: number | null;
  coverUrl: string | null;
  synopsis: string | null;
  authors: string[];
};

/** Episodios por temporada (series). La temporada 0 (especiales) no se incluye. */
export type SeasonInfo = { number: number; episodes: number };

/** Datos completos para crear una entrada a partir de un resultado. */
export type MediaDetails = MediaSearchResult & {
  genres: string[];
  runtimeMinutes: number | null;
  totalEpisodes: number | null;
  episodeMinutes: number | null;
  seasons: SeasonInfo[] | null;
  totalPages: number | null;
};

export interface MediaProvider {
  id: ExternalProvider;
  mediaTypes: MediaType[];
  /** Formato válido del id externo (se valida antes de llamar a la API). */
  externalIdPattern: RegExp;
  search(query: string, mediaType: MediaType): Promise<MediaSearchResult[]>;
  getDetails(externalId: string, mediaType: MediaType): Promise<MediaDetails | null>;
}

/** Campos de MediaDetails que no aplican a todos los tipos, a null por defecto. */
export const EMPTY_DETAILS = {
  genres: [],
  runtimeMinutes: null,
  totalEpisodes: null,
  episodeMinutes: null,
  seasons: null,
  totalPages: null,
} satisfies Omit<MediaDetails, keyof MediaSearchResult>;
