import Link from "next/link";

import { MEDIA_TYPE_LABELS, statusLabel } from "@/lib/constants";
import type { EntryCardData } from "@/lib/db/entries";
import { describeProgress } from "@/lib/progress";

import { CoverImage } from "./cover-image";

const GRID_SIZES = "(min-width: 1024px) 180px, (min-width: 640px) 25vw, 45vw";

type EntryCardProps = {
  entry: EntryCardData;
  preload?: boolean;
  /** En el catálogo mezclado se indica el tipo; filtrado por tipo sobra. */
  showType?: boolean;
};

export function EntryCard({ entry, preload, showType }: EntryCardProps) {
  // En tarjetas no hace falta el reparto por temporadas: basta con el texto corto.
  const progress =
    entry.status === "in_progress" || entry.status === "paused"
      ? describeProgress({
          mediaType: entry.media_type,
          currentSeason: entry.current_season,
          currentEpisode: entry.current_episode,
          totalEpisodes: entry.total_episodes,
          currentPage: entry.current_page,
          totalPages: entry.total_pages,
          seasons: null,
        })
      : null;

  const details = [
    showType ? MEDIA_TYPE_LABELS[entry.media_type] : null,
    progress ?? statusLabel(entry.status, entry.media_type),
  ].filter(Boolean);

  return (
    <Link href={`/entry/${entry.id}`} className="group flex flex-col gap-2">
      <div className="relative">
        <CoverImage
          src={entry.cover_url}
          alt={entry.title}
          sizes={GRID_SIZES}
          preload={preload}
          className="transition group-hover:opacity-90 group-focus-visible:ring-2 group-focus-visible:ring-accent"
        />
        {entry.score !== null && (
          <span className="absolute top-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
            {entry.score}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{entry.title}</p>
        <p className="truncate text-xs text-muted">{details.join(" · ")}</p>
      </div>
    </Link>
  );
}
