import { get, route } from "remix/routes";

// Mutations are server functions posted to the page that renders their form, so this map holds
// only GET routes. The frame routes (`boards.list`, `board.title`, `board.columns`,
// `board.column`) are ordinary routes that render one section of a page; `<Frame>` requests them
// through the router, and the browser reloads them after the mutations that change them.
export const routes = route({
  home: "/",

  auth: {
    login: { index: get("login") },
    signup: { index: get("signup") },
  },

  boards: route("boards", {
    index: get("/"),
    list: get("/list"),
  }),

  board: route("board/:boardId", {
    index: get("/"),
    title: get("/title"),
    columns: get("/columns"),
    column: get("/columns/:columnId"),
  }),
});
