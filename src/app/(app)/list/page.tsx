import type { Metadata } from "next";
import Link from "next/link";

import { PrioritySelect } from "@/components/collection/priority-select";
import { RandomPicker } from "@/components/collection/random-picker";
import { EntryCard } from "@/components/entries/entry-card";
import { requireUser } from "@/lib/auth/session";
import { MEDIA_TYPES, MEDIA_TYPE_PLURAL_LABELS } from "@/lib/constants";
import { listPlanned } from "@/lib/db/entries";
import { parseMediaType } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Mi lista",
};

export default async function ListPage(props: PageProps<"/list">) {
  const user = await requireUser();
  const mediaType = parseMediaType((await props.searchParams).type);

  const planned = await listPlanned(user.id);
  const visible = mediaType ? planned.filter((entry) => entry.media_type === mediaType) : planned;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Mi lista</h1>
        <p className="mt-1 text-sm text-muted">
          Lo que tienes pendiente (estado “Por ver” / “Por leer”), por prioridad.
        </p>
      </div>

      {planned.length > 0 && <RandomPicker entries={planned} />}

      <nav aria-label="Filtrar por tipo" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[undefined, ...MEDIA_TYPES].map((type) => {
          const active = mediaType === type;
          return (
            <Link
              key={type ?? "all"}
              href={type ? `/list?type=${type}` : "/list"}
              aria-current={active ? "page" : undefined}
              scroll={false}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {type ? MEDIA_TYPE_PLURAL_LABELS[type] : "Todo"}
            </Link>
          );
        })}
      </nav>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
          {visible.map((entry, index) => (
            <li key={entry.id}>
              <EntryCard
                entry={entry}
                preload={index < 4}
                showType={!mediaType}
                extra={
                  <PrioritySelect entryId={entry.id} priority={entry.priority} className="w-full" />
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <section className="flex flex-col items-center gap-3 py-20 text-center">
          <h2 className="text-lg font-semibold">Tu lista está vacía</h2>
          <p className="text-sm text-muted">
            Añade algo con el estado “Por ver” y aparecerá aquí para que no se te olvide.
          </p>
          <Link
            href={mediaType ? `/add?type=${mediaType}` : "/add"}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Añadir
          </Link>
        </section>
      )}
    </div>
  );
}
