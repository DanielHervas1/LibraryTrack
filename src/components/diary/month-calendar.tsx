import Image from "next/image";

import type { CalendarDay, DiaryEvent } from "@/lib/diary";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MAX_THUMBS = 2;

type MonthCalendarProps = {
  weeks: CalendarDay[][];
  /** Eventos ya agregados, por fecha. */
  eventsByDate: Map<string, DiaryEvent[]>;
  today: string;
};

/** Cuadrícula del mes: cada día con actividad enlaza a su grupo en la cronología. */
export function MonthCalendar({ weeks, eventsByDate, today }: MonthCalendarProps) {
  return (
    <div role="grid" aria-label="Calendario" className="flex flex-col gap-1">
      <div role="row" className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((day) => (
          <span key={day} role="columnheader">
            {day}
          </span>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].date} role="row" className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const events = day.inMonth ? (eventsByDate.get(day.date) ?? []) : [];
            // Una miniatura por entrada distinta del día.
            const entries = [...new Map(events.map((e) => [e.entry.id, e.entry])).values()];
            const isToday = day.date === today;
            const content = (
              <>
                <span
                  className={`text-xs tabular-nums ${isToday ? "rounded-full bg-accent px-1.5 font-semibold text-accent-foreground" : ""}`}
                >
                  {day.day}
                </span>
                {entries.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {entries.slice(0, MAX_THUMBS).map((entry) => (
                      <span
                        key={entry.id}
                        className="relative aspect-[2/3] w-3.5 overflow-hidden rounded-[2px] bg-chart sm:w-5"
                      >
                        {entry.cover_url && (
                          <Image
                            src={entry.cover_url}
                            alt=""
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        )}
                      </span>
                    ))}
                    {entries.length > MAX_THUMBS && (
                      <span className="text-[10px] text-muted">+{entries.length - MAX_THUMBS}</span>
                    )}
                  </span>
                )}
              </>
            );

            const cellClass = `flex min-h-14 flex-col items-center gap-1 rounded-lg p-1 sm:min-h-20 ${
              day.inMonth ? "" : "opacity-30"
            }`;

            return entries.length > 0 ? (
              <a
                key={day.date}
                role="gridcell"
                href={`#d-${day.date}`}
                aria-label={`${day.day}: ${entries.length} ${entries.length === 1 ? "título" : "títulos"}`}
                className={`${cellClass} bg-surface hover:ring-2 hover:ring-accent`}
              >
                {content}
              </a>
            ) : (
              <div key={day.date} role="gridcell" className={cellClass}>
                {content}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
