"use client";

import { useState } from "react";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

/** Nota 1-10 como fila de botones; pulsar la nota elegida la quita. */
export function ScoreInput({ initialScore }: { initialScore: number | null }) {
  const [score, setScore] = useState<number | null>(initialScore);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">
        Nota <span className="font-normal text-muted">{score ? `${score}/10` : "sin nota"}</span>
      </legend>
      <input type="hidden" name="score" value={score ?? ""} />
      <div className="grid grid-cols-10 gap-1">
        {SCORES.map((value) => {
          const active = score !== null && value <= score;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setScore(score === value ? null : value)}
              aria-label={`${value} de 10`}
              aria-pressed={score === value}
              className={`h-9 rounded-md text-sm font-medium transition ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
