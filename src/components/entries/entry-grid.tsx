import type { EntryCardData } from "@/lib/db/entries";

import { EntryCard } from "./entry-card";

export function EntryGrid({ entries, showType }: { entries: EntryCardData[]; showType?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
      {entries.map((entry, index) => (
        <li key={entry.id}>
          <EntryCard entry={entry} preload={index < 4} showType={showType} />
        </li>
      ))}
    </ul>
  );
}
