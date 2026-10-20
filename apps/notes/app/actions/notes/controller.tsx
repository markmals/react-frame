import { createController } from "remix/router";

import { deleteNote, listNotes } from "../../data/notes.ts";
import { routes } from "../../routes.ts";
import { NotesPage } from "../pages.tsx";

export default createController(routes.notes, {
  actions: {
    show({ params, render, url }) {
      return render(
        <NotesPage activeNoteId={params.noteId} query={url.searchParams.get("q") ?? ""} />,
      );
    },

    async destroy({ request }) {
      await deleteNote(await request.formData());
      let [next] = await listNotes();

      return new Response(null, {
        status: 303,
        headers: {
          Location: next ? routes.notes.show.href({ noteId: next.id }) : routes.home.href(),
        },
      });
    },
  },
});
