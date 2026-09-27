"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { SearchResponse } from "@/app/api/search/[provider]/route";
import { addFromProvider } from "@/lib/actions/entries";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: SearchResponse["results"] }
  | { status: "error" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
    >
      {pending ? "Añadiendo…" : "Añadir"}
    </button>
  );
}

export function MediaSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: "loading" });
      try {
        const params = new URLSearchParams({ type: "movie", q });
        const response = await fetch(`/api/search/tmdb?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as SearchResponse;
        setState({ status: "done", results: data.results });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setState({ status: "error" });
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const tooShort = query.trim().length < MIN_QUERY_LENGTH;

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Busca una película…"
        aria-label="Buscar película"
        autoFocus
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent"
      />

      {!tooShort && state.status === "loading" && <p className="text-sm text-muted">Buscando…</p>}
      {!tooShort && state.status === "error" && (
        <p className="text-sm text-danger" role="alert">
          No se pudo buscar. Inténtalo de nuevo.
        </p>
      )}
      {!tooShort && state.status === "done" && state.results.length === 0 && (
        <p className="text-sm text-muted">Sin resultados para “{query.trim()}”.</p>
      )}

      {!tooShort && state.status === "done" && state.results.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {state.results.map((result) => (
            <li key={result.externalId} className="flex items-center gap-3 py-3">
              <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded bg-surface">
                {result.coverUrl && (
                  <Image src={result.coverUrl} alt="" fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{result.title}</p>
                <p className="truncate text-sm text-muted">
                  {[result.year, result.originalTitle].filter(Boolean).join(" · ")}
                </p>
              </div>
              {result.entryId ? (
                <Link
                  href={`/entry/${result.entryId}`}
                  className="shrink-0 text-sm text-muted hover:text-foreground"
                >
                  Ya añadida →
                </Link>
              ) : (
                <form action={addFromProvider} className="shrink-0">
                  <input type="hidden" name="provider" value={result.provider} />
                  <input type="hidden" name="mediaType" value={result.mediaType} />
                  <input type="hidden" name="externalId" value={result.externalId} />
                  <AddButton />
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
