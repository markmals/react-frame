import { Frame } from "react-frame";

import { routes } from "../routes.ts";
import { NewNoteButton, SearchForm } from "../ui/app-shell.tsx";

interface NotesPageProps {
  activeNoteId?: string;
  query: string;
}

/**
 * The whole app: a sidebar frame listing notes and a main frame holding the editor. Both are
 * routes of their own, so a save can refresh the list without touching the open editor, and a
 * note link can swap the editor without reloading the list.
 */
export function NotesPage({ activeNoteId, query }: NotesPageProps) {
  return (
    <div className="grid h-screen grid-cols-app bg-canvas">
      <aside className="flex min-h-0 flex-col border-r border-line bg-surface">
        <header className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
          <h1 className="m-0 text-title font-bold">Notes</h1>
          {/* A form with no fields posts a multipart body with no parts, which browsers refuse
              to parse back into FormData, so the title the note starts with is a field. */}
          <form method="POST" action={routes.createNote.href()}>
            <input type="hidden" name="title" value="" />
            <NewNoteButton />
          </form>
        </header>
        <SearchForm />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Frame
            name="note-list"
            src={routes.frames.list.href(null, { searchParams: { q: query || undefined } })}
          />
        </div>
      </aside>
      <main className="min-h-0 overflow-y-auto">
        <Frame
          name="note"
          src={
            activeNoteId === undefined
              ? routes.frames.blank.href()
              : routes.frames.editor.href({ noteId: activeNoteId })
          }
        />
      </main>
    </div>
  );
}

export function NotFoundPage({ url }: { url: URL }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-8">
      <div className="max-w-editor text-center">
        <p className="m-0 text-sm font-bold tracking-label text-accent uppercase">404</p>
        <h1 className="mt-2 text-title font-bold">No page at {url.pathname}</h1>
        <p className="mt-4 leading-body text-body">
          Head back to <a href={routes.home.href()}>your notes</a>.
        </p>
      </div>
    </div>
  );
}
