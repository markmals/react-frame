import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useTransition } from "react";
import { useFrames } from "react-frame/client";

import { type Note, updateNote } from "../../data/notes.ts";
import { routes } from "../../routes.ts";
import { EditorToolbar } from "./editor-toolbar.tsx";

const autosaveDelay = 400;

interface ScheduledSave {
  timer: number;
  start: () => void;
}

export function NoteEditor({ note }: { note: Note }) {
  let frames = useFrames();
  let [saving, startSaving] = useTransition();
  let draft = useRef({ title: note.title, doc: note.doc });
  let scheduled = useRef<ScheduledSave | undefined>(undefined);

  function scheduleSave() {
    let pending = scheduled.current;
    if (pending) {
      // A transition is already waiting to write, so push its deadline out rather than start a
      // second one: "Saving…" then stays on from the first keystroke until the last write lands.
      window.clearTimeout(pending.timer);
      pending.timer = window.setTimeout(pending.start, autosaveDelay);
      return;
    }

    let { promise: debounced, resolve: start } = Promise.withResolvers<void>();
    scheduled.current = { timer: window.setTimeout(start, autosaveDelay), start };
    startSaving(async () => {
      await debounced;
      scheduled.current = undefined;

      let formData = new FormData();
      formData.set("noteId", note.id);
      formData.set("title", draft.current.title);
      formData.set("doc", JSON.stringify(draft.current.doc));
      await updateNote(formData);
      // Only the sidebar shows what the write changed, so only the sidebar loads again. The
      // editor keeps its editor instance, its selection, and whatever was typed meanwhile.
      await frames.get("note-list")?.reload();
    });
  }

  let editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing…" })],
    content: note.doc,
    editorProps: { attributes: { class: "note-body min-h-72", "aria-label": "Note body" } },
    onUpdate({ editor }) {
      draft.current.doc = editor.getJSON();
      scheduleSave();
    },
  });

  return (
    <article className="mx-auto flex h-full max-w-editor flex-col px-6 py-5">
      <header className="flex items-start gap-3">
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>
        <input
          id="note-title"
          name="title"
          defaultValue={note.title}
          autoFocus={note.title === "" && note.text === ""}
          placeholder="Untitled note"
          onChange={(event) => {
            draft.current.title = event.target.value;
            scheduleSave();
          }}
          className="min-w-0 flex-1 border-0 bg-transparent text-title font-bold outline-none"
        />
        <p role="status" className="shrink-0 pt-2 text-xs tracking-label text-muted uppercase">
          {saving ? "Saving…" : "Saved"}
        </p>
        <DeleteNoteButton noteId={note.id} />
      </header>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="mt-4 flex-1" />
    </article>
  );
}

function DeleteNoteButton({ noteId }: { noteId: string }) {
  let dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="shrink-0 cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-bold text-danger"
      >
        Delete
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-note-heading"
        className="m-auto max-w-dialog rounded-xl border border-line bg-surface p-5 text-ink shadow-dialog"
      >
        <h2 id="delete-note-heading" className="m-0 text-lg font-bold">
          Delete this note?
        </h2>
        {/* The title field is uncontrolled, so naming the note here would quote a stale title. */}
        <p className="mt-2 text-sm leading-body text-body">
          This note and everything in it will be removed from this browser for good.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <form method="dialog">
            <button
              type="submit"
              className="cursor-pointer rounded-lg border border-field px-3 py-2 text-sm font-bold text-body"
            >
              Cancel
            </button>
          </form>
          {/* The router handles the delete and redirects to whichever note comes next. */}
          <form method="POST" action={routes.notes.destroy.href({ noteId })}>
            <input type="hidden" name="noteId" value={noteId} />
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-danger px-3 py-2 text-sm font-bold text-surface"
            >
              Delete note
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
