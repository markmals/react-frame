import { useFormStatus } from "react-dom";
import { useFrame } from "react-frame/client";

import { clearGreetings, type Greeting } from "../greetings.ts";

export function RecentGreetings({ greetings }: { greetings: Greeting[] }) {
  let frame = useFrame();

  return (
    <section
      aria-labelledby="recent-greetings"
      className="mt-8 max-w-form rounded-xl border border-line p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-greetings" className="m-0 text-base font-bold">
          Recent greetings
        </h2>
        {/* Unlike the greeting form, which posts to the router, this form action runs the
            mutation in place and reloads only this frame, so a half-typed name stays put. */}
        <form
          action={async () => {
            await clearGreetings();
            await frame.reload();
          }}
        >
          <ClearButton disabled={greetings.length === 0} />
        </form>
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

function ClearButton({ disabled }: { disabled: boolean }) {
  // Pending until the action finishes, the frame's reload included.
  let { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="cursor-pointer rounded-lg border border-field bg-white px-3 py-1 text-sm text-brand disabled:cursor-default disabled:opacity-60"
    >
      {pending ? "Clearing…" : "Clear"}
    </button>
  );
}
