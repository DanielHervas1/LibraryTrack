import "server-only";

import type { MediaType, Provider } from "@/lib/constants";

import { tmdbProvider } from "./tmdb";
import type { MediaProvider } from "./types";

const PROVIDERS: MediaProvider[] = [tmdbProvider];

/** Proveedor por id, solo si soporta ese tipo de contenido. */
export function getProvider(id: Provider, mediaType: MediaType): MediaProvider | null {
  const provider = PROVIDERS.find((p) => p.id === id);
  return provider?.mediaTypes.includes(mediaType) ? provider : null;
}
