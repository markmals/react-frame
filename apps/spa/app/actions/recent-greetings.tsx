import { useTransition } from "react";
import { useFrame } from "react-frame/client";

import { clearGreetings, type Greeting } from "../greetings.ts";

export function RecentGreetings({ greetings }: { greetings: Greeting[] }) {
  let frame = useFrame();
  let [isClearing, startTransition] = useTransition();

  return (
    <section
      aria-labelledby="recent-greetings"
      className="mt-8 max-w-form rounded-xl border border-line p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-greetings" className="m-0 text-base font-bold">
          Recent greetings
        </h2>
        <button
          type="button"
          disabled={greetings.length === 0 || isClearing}
          // Only this frame reloads; the rest of the page, including a half-typed name, stays.
          onClick={() =>
            startTransition(async () => {
              clearGreetings();
              await frame.reload();
            })
          }
          className="cursor-pointer rounded-lg border border-field bg-white px-3 py-1 text-sm text-brand disabled:cursor-default disabled:opacity-60"
        >
          {isClearing ? "Clearing…" : "Clear"}
        </button>
      </div>
      {greetings.length > 0 ? (
        <ol className="mt-3 list-decimal pl-6 text-body">
          {greetings.map((greeting) => (
            <li key={greeting.id}>{greeting.name}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-body">No greetings yet.</p>
      )}
    </section>
  );
}
