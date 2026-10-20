"use client";

import { useId, useState } from "react";

export interface PollProps {
  question: string;
  options: string[];
}

/**
 * A reader check-in embedded in MDX. The post it lives in renders on the server; this is the one
 * island in it, which is the point it is making.
 */
export function Poll({ question, options }: PollProps) {
  let name = useId();
  let [choice, setChoice] = useState<string | null>(null);

  return (
    <fieldset className="my-8 rounded-card border border-rule bg-surface p-6 font-sans text-base shadow-raised">
      <legend className="px-2 text-sm font-bold tracking-wide text-muted uppercase">
        Reader check-in
      </legend>

      <p className="m-0 font-bold">{question}</p>

      <div className="mt-4 flex flex-col gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3">
            <input
              type="radio"
              name={name}
              value={option}
              checked={choice === option}
              onChange={() => setChoice(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>

      <p className="mt-4 mb-0 text-sm text-muted" role="status">
        {choice === null
          ? "Pick one. Nothing is sent anywhere."
          : `You picked “${choice}”. It stays in this page and goes nowhere else.`}
      </p>
    </fieldset>
  );
}
