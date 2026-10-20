import { createController } from "remix/router";

import { createNote } from "../data/notes.ts";
import { routes } from "../routes.ts";
import { NotesPage } from "./pages.tsx";

export default createController(routes, {
  actions: {
    home({ render, url }) {
      return render(<NotesPage query={url.searchParams.get("q") ?? ""} />);
    },

    async createNote({ request }) {
      let note = await createNote(await request.formData());

      return new Response(null, {
        status: 303,
        headers: { Location: routes.notes.show.href({ noteId: note.id }) },
      });
    },
  },
});
