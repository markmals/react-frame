import { useState } from "react";
import { useFrame } from "react-frame/client";

import { routes } from "../routes.ts";
import { useCurrentPath, useCurrentQuery } from "./address-bar.ts";

export function LoadingIndicator() {
  return (
    <div role="status" className="w-full p-8 text-center text-muted">
      Loading…
    </div>
  );
}

/** The submit button of the sidebar's new-note form, which posts to the router. */
export function NewNoteButton() {
  // Pages render outside any frame, so this is the page's own frame: it carries the form data
  // while the POST is in flight.
  let page = useFrame();
  let creating = page.formData !== undefined && page.src === routes.createNote.href();

  return (
    <button
      type="submit"
      disabled={creating}
      aria-busy={creating}
      className="cursor-pointer rounded-lg bg-accent px-3 py-2 text-sm font-bold text-surface disabled:cursor-wait disabled:opacity-70"
    >
      {creating ? "Creating…" : "New note"}
    </button>
  );
}

/**
 * Search runs as a `GET` navigation so the query lives in the address bar, but `data-target` keeps
 * it from reloading the page: only the sidebar's frame loads, from the `data-src` list URL. The
 * box holds what has been typed since, and follows the address bar whenever that moves, which
 * covers back and forward as well as landing on a note with no query.
 */
export function SearchForm() {
  let pathname = useCurrentPath();
  let query = useCurrentQuery();
  let [text, setText] = useState(query);
  let [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setText(query);
  }

  return (
    <form
      role="search"
      method="GET"
      action={pathname}
      data-target="note-list"
      data-src={routes.frames.list.href(null, { searchParams: { q: text.trim() || undefined } })}
      className="flex gap-2 px-4 pb-3"
    >
      <label htmlFor="note-search" className="sr-only">
        Search notes
      </label>
      <input
        id="note-search"
        type="search"
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search notes"
        className="min-w-0 flex-1 rounded-lg border border-field bg-surface px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-lg border border-field px-3 py-2 text-sm font-bold text-body"
      >
        Search
      </button>
    </form>
  );
}
