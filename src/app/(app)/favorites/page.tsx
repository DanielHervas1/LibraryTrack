import type { Metadata } from "next";

import { CatalogFilters } from "@/components/entries/catalog-filters";
import { CatalogSearch } from "@/components/entries/catalog-search";
import { EntryGrid } from "@/components/entries/entry-grid";
import { requireUser } from "@/lib/auth/session";
import { hasActiveFilters } from "@/lib/catalog-url";
import { listEntries, listGenres, listTags } from "@/lib/db/entries";
import { parseCatalogFilters } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default async function FavoritesPage(props: PageProps<"/favorites">) {
  const user = await requireUser();
  const filters = { ...parseCatalogFilters(await props.searchParams), favorites: undefined };

  const [entries, genres, tags] = await Promise.all([
    listEntries(user.id, { ...filters, favorites: true }),
    listGenres(user.id),
    listTags(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Favoritos</h1>

      <CatalogSearch
        filters={filters}
        genres={genres}
        tags={tags.map((tag) => tag.name)}
        basePath="/favorites"
        showFavoritesToggle={false}
      />
      <CatalogFilters filters={filters} basePath="/favorites" />

      {entries.length > 0 ? (
        <EntryGrid entries={entries} showType={!filters.mediaType} />
      ) : (
        <section className="flex flex-col items-center gap-2 py-20 text-center">
          <h2 className="text-lg font-semibold">
            {hasActiveFilters(filters)
              ? "Ningún favorito con estos filtros"
              : "Aún no tienes favoritos"}
          </h2>
          <p className="text-sm text-muted">
            Pulsa el corazón de cualquier portada para guardarla aquí.
          </p>
        </section>
      )}
    </div>
  );
}
