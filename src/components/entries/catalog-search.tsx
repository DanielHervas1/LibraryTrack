"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";

import { catalogHref, type CatalogFilters } from "@/lib/catalog-url";

type CatalogSearchProps = {
  filters: CatalogFilters;
  genres: string[];
  tags: string[];
  basePath?: string;
  showFavoritesToggle?: boolean;
};

const DEBOUNCE_MS = 300;

/** Búsqueda por texto + género, tag y favoritos. Actualiza la URL (compartible). */
export function CatalogSearch({
  filters,
  genres,
  tags,
  basePath = "/",
  showFavoritesToggle = true,
}: CatalogSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query ?? "");
  const [pending, startTransition] = useTransition();
  function navigate(changes: Partial<CatalogFilters>) {
    startTransition(() => {
      router.replace(catalogHref({ ...filters, ...changes }, basePath), { scroll: false });
    });
  }

  // Lee siempre los filtros actuales sin que el efecto dependa de ellos.
  const applyQuery = useEffectEvent((text: string | undefined) => {
    if (text !== filters.query) navigate({ query: text });
  });

  // Texto con debounce; el resto de filtros se aplica al momento.
  useEffect(() => {
    const timer = setTimeout(() => applyQuery(query.trim() || undefined), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const selectClass = "rounded-lg border border-border bg-background px-2 py-1.5 text-sm";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center" aria-busy={pending}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar en mi catálogo…"
        aria-label="Buscar en mi catálogo"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent sm:flex-1"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.genre ?? ""}
          onChange={(event) => navigate({ genre: event.target.value || undefined })}
          aria-label="Filtrar por género"
          className={selectClass}
        >
          <option value="">Todos los géneros</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        {tags.length > 0 && (
          <select
            value={filters.tag ?? ""}
            onChange={(event) => navigate({ tag: event.target.value || undefined })}
            aria-label="Filtrar por tag"
            className={selectClass}
          >
            <option value="">Todos los tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        )}
        {showFavoritesToggle && (
          <label className="flex items-center gap-1.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={Boolean(filters.favorites)}
              onChange={(event) => navigate({ favorites: event.target.checked || undefined })}
              className="accent-[var(--accent)]"
            />
            Solo favoritos
          </label>
        )}
      </div>
    </div>
  );
}
