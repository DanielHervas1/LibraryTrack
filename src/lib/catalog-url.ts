// URL del catálogo a partir de sus filtros. Compartido por los chips (servidor) y la
// barra de búsqueda (cliente) para que un filtro nunca borre los demás.

import type { EntryStatus, MediaType, SortOption } from "@/lib/constants";

export type CatalogFilters = {
  mediaType?: MediaType;
  status?: EntryStatus;
  sort: SortOption;
  query?: string;
  genre?: string;
  tag?: string;
  favorites?: boolean;
};

export function catalogHref(filters: CatalogFilters, basePath = "/"): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.mediaType) params.set("type", filters.mediaType);
  if (filters.status) params.set("status", filters.status);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.favorites) params.set("fav", "1");
  if (filters.sort !== "recent") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.mediaType ||
    filters.status ||
    filters.query ||
    filters.genre ||
    filters.tag ||
    filters.favorites,
  );
}
