"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";

import { inputClass, secondaryButtonClass } from "@/components/ui/styles";
import { addTag, removeTag } from "@/lib/actions/collection";
import type { Tag } from "@/lib/db/entries";
import { TAG_MAX_LENGTH } from "@/lib/validation/tag";

type TagEditorProps = {
  entryId: string;
  tags: Tag[];
  /** Todos los tags del usuario, para autocompletar. */
  allTags: Tag[];
};

/** Tags de la entrada: se guardan al momento (sin botón "Guardar"). */
export function TagEditor({ entryId, tags, allTags }: TagEditorProps) {
  const listId = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = new Set(tags.map((tag) => tag.id));
  const suggestions = allTags.filter((tag) => !current.has(tag.id));

  function add() {
    const name = draft.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await addTag(entryId, name);
      if (result.status === "error") setError(result.message);
      else setDraft("");
    });
  }

  function remove(tagId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeTag(entryId, tagId);
      if (result.status === "error") setError(result.message);
    });
  }

  return (
    <section aria-label="Tags" className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">Tags</h2>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-1 rounded-full border border-border py-1 pr-1 pl-3 text-sm"
            >
              <Link href={`/?tag=${encodeURIComponent(tag.name)}`} className="hover:underline">
                #{tag.name}
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(tag.id)}
                aria-label={`Quitar ${tag.name}`}
                className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          list={listId}
          maxLength={TAG_MAX_LENGTH}
          placeholder="nostalgia, para ver con amigos…"
          aria-label="Nuevo tag"
          className={`${inputClass} py-1.5 text-sm`}
        />
        <datalist id={listId}>
          {suggestions.map((tag) => (
            <option key={tag.id} value={tag.name} />
          ))}
        </datalist>
        <button type="button" disabled={pending} onClick={add} className={secondaryButtonClass}>
          Añadir
        </button>
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
