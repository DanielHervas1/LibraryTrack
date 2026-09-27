import Link from "next/link";

import {
  SORT_OPTIONS,
  STATUSES,
  statusLabel,
  type EntryStatus,
  type SortOption,
} from "@/lib/constants";

type CatalogFiltersProps = {
  status?: EntryStatus;
  sort: SortOption;
};

function href(status: EntryStatus | undefined, sort: SortOption) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (sort !== "recent") params.set("sort", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function Chip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function CatalogFilters({ status, sort }: CatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!status} href={href(undefined, sort)}>
          Todos
        </Chip>
        {STATUSES.map((value) => (
          <Chip key={value} active={status === value} href={href(value, sort)}>
            {statusLabel(value)}
          </Chip>
        ))}
      </nav>
      <nav aria-label="Ordenar" className="flex items-center gap-3 text-sm">
        <span className="text-muted">Ordenar:</span>
        {(Object.keys(SORT_OPTIONS) as SortOption[]).map((value) => (
          <Link
            key={value}
            href={href(status, value)}
            aria-current={sort === value ? "true" : undefined}
            className={
              sort === value ? "font-medium text-foreground" : "text-muted hover:text-foreground"
            }
          >
            {SORT_OPTIONS[value]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
