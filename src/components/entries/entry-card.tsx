import Link from "next/link";

import { statusLabel } from "@/lib/constants";
import type { EntryCardData } from "@/lib/db/entries";

import { CoverImage } from "./cover-image";

const GRID_SIZES = "(min-width: 1024px) 180px, (min-width: 640px) 25vw, 45vw";

export function EntryCard({ entry, preload }: { entry: EntryCardData; preload?: boolean }) {
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
        <p className="text-xs text-muted">
          {[entry.release_year, statusLabel(entry.status, entry.media_type)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}
