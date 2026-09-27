// Lectura segura de parámetros de URL (searchParams llega como string | string[] | undefined).

import {
  MEDIA_TYPES,
  SORT_OPTIONS,
  STATUSES,
  type EntryStatus,
  type MediaType,
  type SortOption,
} from "@/lib/constants";

export function parseMediaType(value: unknown): MediaType | undefined {
  return MEDIA_TYPES.find((type) => type === value);
}

export function parseStatus(value: unknown): EntryStatus | undefined {
  return STATUSES.find((status) => status === value);
}

export function parseSort(value: unknown): SortOption {
  return typeof value === "string" && value in SORT_OPTIONS ? (value as SortOption) : "recent";
}
