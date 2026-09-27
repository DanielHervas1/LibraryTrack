import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/entries/catalog-filters";
import { EntryCard } from "@/components/entries/entry-card";
import { requireUser } from "@/lib/auth/session";
import { statusLabel } from "@/lib/constants";
import { listEntries } from "@/lib/db/entries";
import { parseMediaType, parseSort, parseStatus } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Catálogo",
};

export default async function CatalogPage(props: PageProps<"/">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const mediaType = parseMediaType(searchParams.type);
  const status = parseStatus(searchParams.status);
  const sort = parseSort(searchParams.sort);

  const entries = await listEntries(user.id, { mediaType, status, sort });
  const filtered = Boolean(mediaType || status);
  const addHref = mediaType ? `/add?type=${mediaType}` : "/add";

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

      <CatalogFilters mediaType={mediaType} status={status} sort={sort} />

      {entries.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <EntryCard entry={entry} preload={index < 4} showType={!mediaType} />
            </li>
          ))}
        </ul>
      ) : (
        <section className="flex flex-col items-center gap-3 py-20 text-center">
          <h2 className="text-lg font-semibold">
            {filtered
              ? status
                ? `Nada en "${statusLabel(status, mediaType)}"`
                : "Nada de este tipo todavía"
              : "Tu catálogo está vacío"}
          </h2>
          <p className="text-sm text-muted">
            {filtered
              ? "Prueba con otro filtro o añade algo nuevo."
              : "Busca una película, serie, anime o libro para empezar tu registro."}
          </p>
          <Link
            href={addHref}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Añadir
          </Link>
        </section>
      )}
    </div>
  );
}
