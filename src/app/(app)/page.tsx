import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/entries/catalog-filters";
import { EntryCard } from "@/components/entries/entry-card";
import { requireUser } from "@/lib/auth/session";
import {
  SORT_OPTIONS,
  STATUSES,
  statusLabel,
  type EntryStatus,
  type SortOption,
} from "@/lib/constants";
import { listEntries } from "@/lib/db/entries";

export const metadata: Metadata = {
  title: "Catálogo",
};

function parseStatus(value: unknown): EntryStatus | undefined {
  return STATUSES.find((status) => status === value);
}

function parseSort(value: unknown): SortOption {
  return typeof value === "string" && value in SORT_OPTIONS ? (value as SortOption) : "recent";
}

export default async function CatalogPage(props: PageProps<"/">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const status = parseStatus(searchParams.status);
  const sort = parseSort(searchParams.sort);

  const entries = await listEntries(user.id, { status, sort });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Catálogo</h1>
        <Link
          href="/add"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
        >
          Añadir
        </Link>
      </div>

      <CatalogFilters status={status} sort={sort} />

      {entries.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <EntryCard entry={entry} preload={index < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <section className="flex flex-col items-center gap-3 py-20 text-center">
          <h2 className="text-lg font-semibold">
            {status ? `Nada en "${statusLabel(status)}"` : "Tu catálogo está vacío"}
          </h2>
          <p className="text-sm text-muted">
            {status
              ? "Prueba con otro filtro."
              : "Busca una película y añádela para empezar tu registro."}
          </p>
          {!status && (
            <Link
              href="/add"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Añadir la primera
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
