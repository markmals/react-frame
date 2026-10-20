import { get, route } from "remix/routes";

// Mutations are server functions posted to the page that renders their form, so the map holds
// only GET routes: the two document routes, the frame routes their shell embeds, and the JSON
// routes TanStack Query's queryFns fetch.
export const routes = route({
  home: "/",
  issues: get("/issues"),
  issue: get("/issue/:issueId"),

  frames: route("frames", {
    menu: get("/menu"),
    list: get("/list"),
    issue: get("/issue/:issueId"),
  }),

  api: route("api", {
    issues: get("/issues"),
    issue: get("/issues/:issueId"),
    comments: get("/issues/:issueId/comments"),
  }),
});
