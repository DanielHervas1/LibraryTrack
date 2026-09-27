import Link from "next/link";

import { catalogHref, type CatalogFilters as Filters } from "@/lib/catalog-url";
import {
  MEDIA_TYPES,
  MEDIA_TYPE_PLURAL_LABELS,
  SORT_OPTIONS,
  STATUSES,
  statusLabel,
  type SortOption,
} from "@/lib/constants";

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
      scroll={false}
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

type CatalogFiltersProps = {
  filters: Filters;
  basePath?: string;
  /** En "Favoritos" no tiene sentido filtrar por estado pendiente, pero sí por tipo. */
  showStatus?: boolean;
};

export function CatalogFilters({
  filters,
  basePath = "/",
  showStatus = true,
}: CatalogFiltersProps) {
  const { mediaType, status, sort } = filters;
  const href = (changes: Partial<Filters>) => catalogHref({ ...filters, ...changes }, basePath);

  return (
    <div className="flex flex-col gap-3">
      <nav
        aria-label="Filtrar por tipo"
        className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4"
      >
        <Chip active={!mediaType} href={href({ mediaType: undefined })}>
          Todo
        </Chip>
        {MEDIA_TYPES.map((value) => (
          <Chip key={value} active={mediaType === value} href={href({ mediaType: value })}>
            {MEDIA_TYPE_PLURAL_LABELS[value]}
          </Chip>
        ))}
      </nav>

      {showStatus && (
        <nav
          aria-label="Filtrar por estado"
          className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4"
        >
          <Chip active={!status} href={href({ status: undefined })}>
            Cualquier estado
          </Chip>
          {STATUSES.map((value) => (
            <Chip key={value} active={status === value} href={href({ status: value })}>
              {statusLabel(value, mediaType)}
            </Chip>
          ))}
        </nav>
      )}

      <nav aria-label="Ordenar" className="flex items-center gap-3 text-sm">
        <span className="text-muted">Ordenar:</span>
        {(Object.keys(SORT_OPTIONS) as SortOption[]).map((value) => (
          <Link
            key={value}
            href={href({ sort: value })}
            scroll={false}
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
