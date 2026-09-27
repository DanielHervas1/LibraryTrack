import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CoverEditor } from "@/components/entries/cover-editor";
import { CoverImage } from "@/components/entries/cover-image";
import { DeleteEntryButton } from "@/components/entries/delete-entry-button";
import { EntryForm } from "@/components/entries/entry-form";
import { ProgressControl } from "@/components/entries/progress-control";
import { requireUser } from "@/lib/auth/session";
import { MEDIA_TYPE_LABELS } from "@/lib/constants";
import { getEntry, type Entry } from "@/lib/db/entries";
import { parseEntryMetadata } from "@/lib/entry-metadata";
import { getSupabaseEnv } from "@/lib/env";
import { progressStateFromRow } from "@/lib/progress";
import { isOwnCoverUrl } from "@/lib/storage/covers";

const PROVIDER_CREDITS: Record<Entry["provider"], string | null> = {
  tmdb: "Datos de TMDB",
  anilist: "Datos de AniList",
  google_books: "Datos de Google Books",
  open_library: "Datos de Open Library",
  manual: null,
};

async function loadEntry(id: string) {
  const user = await requireUser();
  const entry = await getEntry(user.id, id);
  if (!entry) notFound();
  return { user, entry };
}

export async function generateMetadata(props: PageProps<"/entry/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const { entry } = await loadEntry(id);
  return { title: entry.title };
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Línea de datos según el tipo: año, duración, temporadas, páginas… */
function entryFacts(entry: Entry): string[] {
  const seasons = parseEntryMetadata(entry.metadata).seasons;
  const facts: (string | number | null)[] = [
    MEDIA_TYPE_LABELS[entry.media_type],
    entry.release_year,
  ];

  if (entry.media_type === "movie" && entry.runtime_minutes) {
    facts.push(formatMinutes(entry.runtime_minutes));
  }
  if (entry.media_type === "tv" && seasons?.length) {
    facts.push(plural(seasons.length, "temporada", "temporadas"));
  }
  if ((entry.media_type === "tv" || entry.media_type === "anime") && entry.total_episodes) {
    facts.push(plural(entry.total_episodes, "episodio", "episodios"));
  }
  if (entry.episode_minutes) facts.push(`${entry.episode_minutes} min/ep.`);
  if (entry.media_type === "book" && entry.total_pages) {
    facts.push(plural(entry.total_pages, "página", "páginas"));
  }
  return facts.filter((fact): fact is string | number => Boolean(fact)).map(String);
}

export default async function EntryPage(props: PageProps<"/entry/[id]">) {
  const { id } = await props.params;
  const { user, entry } = await loadEntry(id);

  const providerCover = parseEntryMetadata(entry.metadata).provider_cover_url;
  const isCustomCover =
    entry.cover_url !== null && isOwnCoverUrl(entry.cover_url, getSupabaseEnv().url, user.id);
  const credit = PROVIDER_CREDITS[entry.provider];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-3">
          <div className="mx-auto w-44 md:w-full">
            <CoverImage
              src={entry.cover_url}
              alt={entry.title}
              sizes="(min-width: 768px) 240px, 176px"
              preload
            />
          </div>
          <CoverEditor
            entryId={entry.id}
            userId={user.id}
            isCustom={isCustomCover}
            hasProviderCover={Boolean(providerCover)}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{entry.title}</h1>
            {entry.original_title && <p className="text-sm text-muted">{entry.original_title}</p>}
            {entry.authors.length > 0 && <p className="text-sm">{entry.authors.join(", ")}</p>}
            <p className="text-sm text-muted">{entryFacts(entry).join(" · ")}</p>
            {entry.synopsis && (
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{entry.synopsis}</p>
            )}
            {credit && <p className="text-xs text-muted">{credit}</p>}
          </header>

          {entry.media_type !== "movie" && (
            <ProgressControl
              entryId={entry.id}
              status={entry.status}
              progress={progressStateFromRow(entry)}
              episodeMinutes={entry.episode_minutes}
            />
          )}

          <EntryForm entry={entry} />

          <div className="border-t border-border pt-4">
            <DeleteEntryButton entryId={entry.id} title={entry.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
