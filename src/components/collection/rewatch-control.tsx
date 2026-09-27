"use client";

import { useState, useTransition } from "react";

import { compactInputClass, secondaryButtonClass } from "@/components/ui/styles";
import { addRewatch, removeRewatch } from "@/lib/actions/collection";
import type { MediaType } from "@/lib/constants";
import type { Rewatch } from "@/lib/db/entries";

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(date: string) {
  // Las fechas son "YYYY-MM-DD" sin hora: se interpretan como mediodía UTC para evitar
  // que la zona horaria las mueva al día anterior.
  return dateFormat.format(new Date(`${date}T12:00:00Z`));
}

type RewatchControlProps = {
  entryId: string;
  mediaType: MediaType;
  rewatches: Rewatch[];
};

export function RewatchControl({ entryId, mediaType, rewatches }: RewatchControlProps) {
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isBook = mediaType === "book";

  function run(action: () => ReturnType<typeof addRewatch>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") setError(result.message);
      else setDate("");
    });
  }

  return (
    <section aria-label={isBook ? "Relecturas" : "Rewatches"} className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">
        {isBook ? "Relecturas" : "Rewatches"}{" "}
        <span className="font-normal text-muted">{rewatches.length}</span>
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => addRewatch(entryId, date || undefined))}
          className={secondaryButtonClass}
        >
          {isBook ? "Releído" : "Vuelto a ver"} {date ? "ese día" : "hoy"}
        </button>
        <label className="flex items-center gap-2 text-sm text-muted">
          o el
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={compactInputClass}
          />
        </label>
      </div>

      {rewatches.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-sm">
          {rewatches.map((rewatch) => (
            <li
              key={rewatch.id}
              className="flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-3"
            >
              {formatDate(rewatch.date)}
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeRewatch(entryId, rewatch.id))}
                aria-label={`Borrar el del ${formatDate(rewatch.date)}`}
                className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-border hover:text-foreground"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
