import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CoverEditor } from "@/components/entries/cover-editor";
import { CoverImage } from "@/components/entries/cover-image";
import { DeleteEntryButton } from "@/components/entries/delete-entry-button";
import { EntryForm } from "@/components/entries/entry-form";
import { requireUser } from "@/lib/auth/session";
import { MEDIA_TYPE_LABELS } from "@/lib/constants";
import { getEntry } from "@/lib/db/entries";
import { getSupabaseEnv } from "@/lib/env";
import { isOwnCoverUrl } from "@/lib/storage/covers";

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

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${rest} min` : `${rest} min`;
}

export default async function EntryPage(props: PageProps<"/entry/[id]">) {
  const { id } = await props.params;
  const { user, entry } = await loadEntry(id);

  const providerCover = (entry.metadata as { provider_cover_url?: string | null } | null)
    ?.provider_cover_url;
  const isCustomCover =
    entry.cover_url !== null && isOwnCoverUrl(entry.cover_url, getSupabaseEnv().url, user.id);

  const facts = [
    MEDIA_TYPE_LABELS[entry.media_type],
    entry.release_year,
    entry.runtime_minutes ? formatRuntime(entry.runtime_minutes) : null,
  ].filter(Boolean);

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
            <p className="text-sm text-muted">{facts.join(" · ")}</p>
            {entry.synopsis && <p className="mt-2 text-sm leading-relaxed">{entry.synopsis}</p>}
            {entry.provider === "tmdb" && <p className="text-xs text-muted">Datos de TMDB</p>}
          </header>

          <EntryForm entry={entry} />

          <div className="border-t border-border pt-4">
            <DeleteEntryButton entryId={entry.id} title={entry.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
