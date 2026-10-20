import { createController } from "remix/router";

import { getNote, listNotes } from "../../data/notes.ts";
import { routes } from "../../routes.ts";
import { BlankPane, NoteNotFound } from "./empty-panes.tsx";
import { NoteEditor } from "./note-editor.tsx";
import { NoteList } from "./note-list.tsx";

export default createController(routes.frames, {
  actions: {
    async list({ render, url }) {
      let query = url.searchParams.get("q") ?? "";

      return render(<NoteList notes={await listNotes(query)} query={query} />);
    },

    blank({ render }) {
      return render(<BlankPane />);
    },

    async editor({ params, render }) {
      let note = await getNote(params.noteId);

      if (!note) {
        return render(<NoteNotFound />, { status: 404 });
      }

      // Loading another note into this frame renders the same component in the same place, so
      // the key is what tells React to build a fresh editor around the new document.
      return render(<NoteEditor key={note.id} note={note} />);
    },
  },
});
