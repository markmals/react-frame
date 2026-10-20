import { routes } from "../../routes.ts";

/** The main frame before a note is chosen. */
export function BlankPane() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-editor text-center">
        <h2 className="m-0 text-title font-bold">No note selected</h2>
        <p className="mt-3 leading-body text-body">
          Pick a note from the sidebar, or start a new one.
        </p>
      </div>
    </div>
  );
}

export function NoteNotFound() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-editor text-center">
        <h2 className="m-0 text-title font-bold">Note not found</h2>
        <p className="mt-3 leading-body text-body">
          It may have been deleted in this browser. <a href={routes.home.href()}>Back to notes</a>.
        </p>
      </div>
    </div>
  );
}
