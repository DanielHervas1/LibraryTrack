"use client";

import Link from "next/link";
import { useState } from "react";

import { CoverImage } from "@/components/entries/cover-image";
import { primaryButtonClass } from "@/components/ui/styles";
import {
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  MEDIA_TYPE_PLURAL_LABELS,
  type MediaType,
} from "@/lib/constants";
import type { PlannedEntry } from "@/lib/db/entries";
import { filterCandidates, pickRandom, sessionMinutes } from "@/lib/random-pick";

const DURATIONS = [
  { value: 0, label: "Cualquier duración" },
  { value: 30, label: "≤ 30 min" },
  { value: 60, label: "≤ 1 h" },
  { value: 120, label: "≤ 2 h" },
];

type Candidate = Pick<
  PlannedEntry,
  | "id"
  | "title"
  | "cover_url"
  | "media_type"
  | "release_year"
  | "runtime_minutes"
  | "episode_minutes"
>;

/** "No sé qué ver": elige algo al azar de Mi lista. */
export function RandomPicker({ entries }: { entries: Candidate[] }) {
  const [mediaType, setMediaType] = useState<MediaType | "">("");
  const [maxMinutes, setMaxMinutes] = useState(0);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [empty, setEmpty] = useState(false);

  function pick() {
    const candidates = filterCandidates(entries, {
      mediaType: mediaType || undefined,
      maxMinutes: maxMinutes || undefined,
    });
    const next = pickRandom(candidates, picked?.id);
    setPicked(next);
    setEmpty(next === null);
  }

  const selectClass = "rounded-lg border border-border bg-background px-2 py-1.5 text-sm";
  const minutes = picked ? sessionMinutes(picked) : null;

  return (
    <section aria-label="No sé qué ver" className="flex flex-col gap-4 rounded-xl bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as MediaType | "")}
          aria-label="Tipo"
          className={selectClass}
        >
          <option value="">Cualquier tipo</option>
          {MEDIA_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEDIA_TYPE_PLURAL_LABELS[type]}
            </option>
          ))}
        </select>
        <select
          value={maxMinutes}
          onChange={(event) => setMaxMinutes(Number(event.target.value))}
          aria-label="Duración máxima"
          className={selectClass}
        >
          {DURATIONS.map((duration) => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={pick} className={`${primaryButtonClass} ml-auto`}>
          {picked ? "Otra" : "🎲 No sé qué ver"}
        </button>
      </div>

      {empty && (
        <p className="text-sm text-muted" role="status">
          Nada en tu lista encaja con esos filtros.
        </p>
      )}

      {picked && (
        <Link
          href={`/entry/${picked.id}`}
          className="flex items-center gap-4 rounded-lg p-1 hover:bg-background"
          role="status"
        >
          <div className="w-16 shrink-0">
            <CoverImage src={picked.cover_url} alt={picked.title} sizes="64px" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted">Te toca…</p>
            <p className="truncate text-lg font-semibold">{picked.title}</p>
            <p className="text-sm text-muted">
              {[
                MEDIA_TYPE_LABELS[picked.media_type],
                picked.release_year,
                minutes ? `${minutes} min${picked.media_type === "movie" ? "" : "/ep."}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </Link>
      )}
    </section>
  );
}
