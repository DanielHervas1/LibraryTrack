import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/entries/catalog-filters";
import { CatalogSearch } from "@/components/entries/catalog-search";
import { EntryGrid } from "@/components/entries/entry-grid";
import { requireUser } from "@/lib/auth/session";
import { catalogHref, hasActiveFilters } from "@/lib/catalog-url";
import { listEntries, listGenres, listTags } from "@/lib/db/entries";
import { parseCatalogFilters } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Catálogo",
};

export default async function CatalogPage(props: PageProps<"/">) {
  const user = await requireUser();
  const filters = parseCatalogFilters(await props.searchParams);

  const [entries, genres, tags] = await Promise.all([
    listEntries(user.id, filters),
    listGenres(user.id),
    listTags(user.id),
  ]);
  const filtered = hasActiveFilters(filters);
  const addHref = filters.mediaType ? `/add?type=${filters.mediaType}` : "/add";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Catálogo</h1>
        <Link
          href={addHref}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
        >
          Añadir
        </Link>
      </div>

      <CatalogSearch filters={filters} genres={genres} tags={tags.map((tag) => tag.name)} />
      <CatalogFilters filters={filters} />

      {entries.length > 0 ? (
        <EntryGrid entries={entries} showType={!filters.mediaType} />
      ) : (
        <section className="flex flex-col items-center gap-3 py-20 text-center">
          <h2 className="text-lg font-semibold">
            {filtered ? "Nada con estos filtros" : "Tu catálogo está vacío"}
          </h2>
          <p className="text-sm text-muted">
            {filtered
              ? "Prueba a quitar algún filtro."
              : "Busca una película, serie, anime o libro para empezar tu registro."}
          </p>
          {filtered ? (
            <Link
              href={catalogHref({ sort: filters.sort })}
              className="text-sm text-accent hover:underline"
            >
              Quitar filtros
            </Link>
          ) : (
            <Link
              href={addHref}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Añadir
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
