"use client";

import { useOptimistic, useTransition } from "react";

import { setPriority } from "@/lib/actions/collection";
import { PRIORITY_LABELS } from "@/lib/constants";
import { selectClass } from "@/components/ui/styles";

type PrioritySelectProps = {
  entryId: string;
  priority: number | null;
  className?: string;
};

/** Prioridad en "Mi lista"; se guarda al cambiarla. */
export function PrioritySelect({ entryId, priority, className = "" }: PrioritySelectProps) {
  const [optimistic, setOptimistic] = useOptimistic(priority);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={optimistic ?? ""}
      disabled={pending}
      aria-label="Prioridad"
      onChange={(event) => {
        const value = event.target.value ? Number(event.target.value) : null;
        startTransition(async () => {
          setOptimistic(value);
          await setPriority(entryId, value);
        });
      }}
      className={`${selectClass} ${className}`}
    >
      <option value="">Sin prioridad</option>
      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          Prioridad {label.toLowerCase()}
        </option>
      ))}
    </select>
  );
}
