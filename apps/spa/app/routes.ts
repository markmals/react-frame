import { get, post, route } from "remix/routes";

export const routes = route({
  home: get("/"),
  about: get("/about"),
  greet: get("/greet"),
  submitGreet: post("/greet"),
  // A frame on the greeting page, not a page of its own.
  greetings: get("/greetings"),
});
