import Link from "next/link";

import {
  MEDIA_TYPES,
  MEDIA_TYPE_PLURAL_LABELS,
  SORT_OPTIONS,
  STATUSES,
  statusLabel,
  type EntryStatus,
  type MediaType,
  type SortOption,
} from "@/lib/constants";

type Filters = {
  mediaType?: MediaType;
  status?: EntryStatus;
  sort: SortOption;
};

function href({ mediaType, status, sort }: Filters) {
  const params = new URLSearchParams();
  if (mediaType) params.set("type", mediaType);
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

export function CatalogFilters(filters: Filters) {
  const { mediaType, status, sort } = filters;

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Filtrar por tipo" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!mediaType} href={href({ ...filters, mediaType: undefined })}>
          Todo
        </Chip>
        {MEDIA_TYPES.map((value) => (
          <Chip
            key={value}
            active={mediaType === value}
            href={href({ ...filters, mediaType: value })}
          >
            {MEDIA_TYPE_PLURAL_LABELS[value]}
          </Chip>
        ))}
      </nav>

      <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!status} href={href({ ...filters, status: undefined })}>
          Cualquier estado
        </Chip>
        {STATUSES.map((value) => (
          <Chip key={value} active={status === value} href={href({ ...filters, status: value })}>
            {statusLabel(value, mediaType)}
          </Chip>
        ))}
      </nav>

      <nav aria-label="Ordenar" className="flex items-center gap-3 text-sm">
        <span className="text-muted">Ordenar:</span>
        {(Object.keys(SORT_OPTIONS) as SortOption[]).map((value) => (
          <Link
            key={value}
            href={href({ ...filters, sort: value })}
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
