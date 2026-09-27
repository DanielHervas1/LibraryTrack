"use client";

import { useTransition } from "react";

import { deleteEntry } from "@/lib/actions/entries";

export function DeleteEntryButton({ entryId, title }: { entryId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`¿Borrar "${title}" de tu catálogo? No se puede deshacer.`)) return;
        startTransition(() => deleteEntry(entryId));
      }}
      className="text-sm text-danger hover:underline disabled:opacity-60"
    >
      {pending ? "Borrando…" : "Borrar entrada"}
    </button>
  );
}
