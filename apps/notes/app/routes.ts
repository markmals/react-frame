import { get, post, route } from "remix/routes";

export const routes = route({
  // Pages. `home` is the app with nothing open; `notes.show` is the app with a note open.
  home: get("/"),
  notes: route("notes", {
    show: get("/:noteId"),
    // Creating and deleting move the browser to a different note, so they post to the router and
    // answer with a redirect. Each posts to a URL that is also a page, so no URL is POST-only:
    // a router that can't render a method mismatch would otherwise leave the app blank.
    destroy: post("/:noteId"),
  }),
  createNote: post("/"),

  // Routes that only render inside a <Frame>: the sidebar list and the editor pane.
  frames: route("frames", {
    list: get("/notes"),
    blank: get("/editor"),
    editor: get("/editor/:noteId"),
  }),
});
