import { defineCollection } from "@withsprinkles/content-layer";
import { file, glob } from "@withsprinkles/content-layer/loaders";
import * as s from "remix/data-schema";
import * as coerce from "remix/data-schema/coerce";

// content-layer imports this file with a plain Node `import()`, so it runs outside Vite: no
// `import.meta.env`, no path aliases, and loader paths resolve from the app directory.
let authors = defineCollection({
  loader: file("app/content/authors.json"),
  schema: s.object({
    id: s.string(),
    name: s.string(),
    role: s.string(),
    bio: s.string(),
  }),
});

let posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "app/content/posts" }),
  schema: s.object({
    title: s.string(),
    description: s.string(),
    publishedOn: coerce.date(),
    // content-layer's `reference()` would belong here, but its schema object predates
    // `remix/data-schema`'s `transform()` and no longer satisfies `Schema`, so the author is a
    // plain id resolved with `getEntry("authors", id)`.
    author: s.string(),
    tags: s.array(s.string()),
    draft: s.optional(s.boolean()),
  }),
});

export let collections = { authors, posts };
