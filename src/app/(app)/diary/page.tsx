import type { Metadata } from "next";
import Link from "next/link";

import { MonthCalendar } from "@/components/diary/month-calendar";
import { CoverImage } from "@/components/entries/cover-image";
import { requireUser } from "@/lib/auth/session";
import { MEDIA_TYPE_LABELS, todayISO } from "@/lib/constants";
import { getDiaryEvents } from "@/lib/db/diary";
import {
  aggregateEvents,
  buildMonthGrid,
  describeEvent,
  formatMonth,
  groupByDate,
  monthRange,
  parseMonth,
  shiftMonth,
} from "@/lib/diary";

export const metadata: Metadata = {
  title: "Diario",
};

const monthTitle = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayTitle = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Las fechas son "YYYY-MM-DD" sin hora: mediodía UTC evita saltos de día por zona horaria. */
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default async function DiaryPage(props: PageProps<"/diary">) {
  const user = await requireUser();
  const today = todayISO();
  const current = parseMonth((await props.searchParams).month, today);
  const { from, to } = monthRange(current);

  const events = aggregateEvents(await getDiaryEvents(user.id, from, to));
  const days = groupByDate(events);
  const eventsByDate = new Map(days);

  const previous = formatMonth(shiftMonth(current, -1));
  const next = formatMonth(shiftMonth(current, 1));
  const isCurrentMonth = formatMonth(current) === today.slice(0, 7);

  const navClass =
    "flex size-9 items-center justify-center rounded-full text-lg text-muted hover:bg-surface hover:text-foreground";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Diario</h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/diary?month=${previous}`}
            aria-label="Mes anterior"
            className={navClass}
            scroll={false}
          >
            ‹
          </Link>
          <span className="min-w-36 text-center text-sm font-medium">
            {capitalize(monthTitle.format(asDate(from)))}
          </span>
          <Link
            href={`/diary?month=${next}`}
            aria-label="Mes siguiente"
            className={navClass}
            scroll={false}
          >
            ›
          </Link>
          {!isCurrentMonth && (
            <Link href="/diary" className="ml-1 text-sm text-accent hover:underline" scroll={false}>
              Hoy
            </Link>
          )}
        </div>
      </div>

      <MonthCalendar weeks={buildMonthGrid(current)} eventsByDate={eventsByDate} today={today} />

      {days.length > 0 ? (
        <ol className="flex flex-col gap-6">
          {days.map(([date, dayEvents]) => (
            <li key={date} id={`d-${date}`} className="flex scroll-mt-6 flex-col gap-3">
              <h2 className="text-sm font-medium text-muted">
                {capitalize(dayTitle.format(asDate(date)))}
              </h2>
              <ul className="flex flex-col gap-3">
                {dayEvents.map((event, index) => (
                  <li key={`${event.entry.id}-${event.kind}-${index}`}>
                    <Link
                      href={`/entry/${event.entry.id}`}
                      className="flex items-center gap-3 rounded-lg p-1 hover:bg-surface"
                    >
                      <div className="w-10 shrink-0">
                        <CoverImage
                          src={event.entry.cover_url}
                          alt={event.entry.title}
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{event.entry.title}</p>
                        <p className="text-sm text-muted">
                          {describeEvent(event)} · {MEDIA_TYPE_LABELS[event.entry.media_type]}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <section className="flex flex-col items-center gap-2 py-10 text-center">
          <h2 className="font-semibold">Nada registrado este mes</h2>
          <p className="max-w-sm text-sm text-muted">
            Aquí aparece lo que empiezas, terminas, avanzas (+1 episodio, +páginas) y vuelves a ver.
            Las fechas de inicio y fin de cada ficha también cuentan.
          </p>
        </section>
      )}
    </div>
  );
}
