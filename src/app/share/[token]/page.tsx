import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CoverImage } from "@/components/entries/cover-image";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { FavoriteMark, ScoreBadge } from "@/components/ui/cover-badges";
import { MEDIA_TYPES, MEDIA_TYPE_PLURAL_LABELS, statusLabel } from "@/lib/constants";
import { getSharedCollection } from "@/lib/db/share";
import { parseMediaType } from "@/lib/search-params";
import { chipClass } from "@/components/ui/styles";

// Una sola consulta por petición aunque la usen generateMetadata y la página.
const loadCollection = cache(getSharedCollection);

export async function generateMetadata(props: PageProps<"/share/[token]">): Promise<Metadata> {
  const { token } = await props.params;
  const collection = await loadCollection(token);
  const owner = collection?.displayName;
  return {
    title: owner ? `Colección de ${owner}` : "Colección compartida",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

/** Perfil compartido de solo lectura: sin sesión y sin nada editable. */
export default async function SharedCollectionPage(props: PageProps<"/share/[token]">) {
  const { token } = await props.params;
  const collection = await loadCollection(token);
  if (!collection) notFound();

  const mediaType = parseMediaType((await props.searchParams).type);
  const entries = mediaType
    ? collection.entries.filter((entry) => entry.media_type === mediaType)
    : collection.entries;
  const counts = Object.fromEntries(
    MEDIA_TYPES.map((type) => [
      type,
      collection.entries.filter((e) => e.media_type === type).length,
    ]),
  );
  const types = MEDIA_TYPES.filter((type) => counts[type] > 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático pequeño */}
            <img src="/icon.svg" alt="" className="size-5" />
            LibraryTrack
          </p>
          <ThemeToggle />
        </div>
        <h1 className="text-2xl font-semibold">
          {collection.displayName
            ? `La colección de ${collection.displayName}`
            : "Colección compartida"}
        </h1>
        <p className="text-sm text-muted">
          {types
            .map((type) => `${counts[type]} ${MEDIA_TYPE_PLURAL_LABELS[type].toLowerCase()}`)
            .join(" · ") || "Todavía no hay nada que mostrar."}
        </p>
      </header>

      {types.length > 1 && (
        <nav
          aria-label="Filtrar por tipo"
          className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4"
        >
          <Link href={`/share/${token}`} scroll={false} className={chipClass(!mediaType)}>
            Todo
          </Link>
          {types.map((type) => (
            <Link
              key={type}
              href={`/share/${token}?type=${type}`}
              scroll={false}
              className={chipClass(mediaType === type)}
            >
              {MEDIA_TYPE_PLURAL_LABELS[type]}
            </Link>
          ))}
        </nav>
      )}

      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
        {entries.map((entry, index) => (
          <li key={entry.id} className="flex flex-col gap-2">
            <div className="relative">
              <CoverImage
                src={entry.cover_url}
                alt={entry.title}
                sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 45vw"
                preload={index < 4}
              />
              {entry.score !== null && <ScoreBadge score={entry.score} />}
              {entry.is_favorite && <FavoriteMark />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{entry.title}</p>
              <p className="truncate text-xs text-muted">
                {[entry.release_year, statusLabel(entry.status, entry.media_type)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {entry.review && (
                <p className="mt-1 line-clamp-4 text-xs whitespace-pre-line text-muted">
                  “{entry.review}”
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
