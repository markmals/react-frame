import { useFormStatus } from "react-dom";
import { useFrame } from "react-frame/client";

import { type Note, setNotePinned } from "../../data/notes.ts";
import { routes } from "../../routes.ts";
import { useCurrentPath } from "../../ui/address-bar.ts";
import { relativeTime } from "../../ui/relative-time.ts";

interface NoteListProps {
  notes: Note[];
  query: string;
}

export function NoteList({ notes, query }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="px-4 py-6 text-sm leading-body text-muted">
        {query === ""
          ? "No notes yet. Choose New note to start one."
          : `No notes match “${query}”.`}
      </p>
    );
  }

  return (
    <ul aria-label="Notes" className="m-0 list-none p-0">
      {notes.map((note) => (
        <NoteRow key={note.id} note={note} query={query} />
      ))}
    </ul>
  );
}

function NoteRow({ note, query }: { note: Note; query: string }) {
  // The frame this list is rendered in, so pinning refreshes the list and nothing else.
  let list = useFrame();
  let pathname = useCurrentPath();
  let href = routes.notes.show.href(
    { noteId: note.id },
    { searchParams: { q: query || undefined } },
  );
  let title = note.title.trim() === "" ? "Untitled note" : note.title;

  return (
    <li className="relative border-b border-line last:border-b-0">
      {/* The address bar moves to the note's page while only the editor frame loads. */}
      <a
        href={href}
        data-target="note"
        data-src={routes.frames.editor.href({ noteId: note.id })}
        aria-current={pathname === routes.notes.show.href({ noteId: note.id }) ? "page" : undefined}
        className="block px-4 py-3 pr-16 text-inherit no-underline hover:bg-canvas current-page:bg-accent-tint"
      >
        <span className="block truncate font-bold">{title}</span>
        <span className="mt-1 block truncate text-sm text-muted">
          {note.snippet === "" ? "No text yet" : note.snippet}
        </span>
        <span className="mt-1 block text-xs text-muted">
          <time dateTime={new Date(note.updatedAt).toISOString()}>
            {relativeTime(note.updatedAt)}
          </time>
          {note.pinned ? " · Pinned" : null}
        </span>
      </a>
      <form
        action={async (formData) => {
          await setNotePinned(formData);
          await list.reload();
        }}
        className="absolute top-2 right-2"
      >
        <input type="hidden" name="noteId" value={note.id} />
        <input type="hidden" name="pinned" value={note.pinned ? "false" : "true"} />
        <PinButton pinned={note.pinned} title={title} />
      </form>
    </li>
  );
}

function PinButton({ pinned, title }: { pinned: boolean; title: string }) {
  // Pending until the pin is stored and the list has reloaded with the new order.
  let { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={pinned}
      aria-label={`${pinned ? "Unpin" : "Pin"} ${title}`}
      className="cursor-pointer rounded-pill border border-line bg-surface px-2 py-1 text-xs font-bold text-muted aria-pressed:border-accent aria-pressed:text-accent disabled:cursor-wait"
    >
      {pinned ? "Unpin" : "Pin"}
    </button>
  );
}
