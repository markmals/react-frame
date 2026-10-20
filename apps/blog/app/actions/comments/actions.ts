"use server";

import { getContext } from "remix/middleware/async-context";

import { Comments } from "../../data/schema.ts";
import { parseComment } from "./schemas.ts";

const POST_PATH = /^\/posts\/([^/]+)$/;

/**
 * Posted to the post's own URL, so it runs the same way whether the browser submitted the form
 * itself or the comments frame called it in a transition. The slug comes from that URL rather than
 * a field, so a comment can only ever land on the page it was written from.
 *
 * A rejection is stored in the session rather than returned, because the no-JavaScript path
 * renders the page again in a separate request. It is a session value and not flash data: a
 * session loaded with flash is dirty, and the page saves — clearing it — before its frames
 * resolve, so the comments frame would never see it. The comments frame clears it instead.
 */
export async function addComment(formData: FormData) {
  let { db, session, url } = getContext();

  let slug = POST_PATH.exec(url.pathname)?.[1];
  if (slug === undefined) {
    throw new Error(`Comments can only be posted from a post page, not ${url.pathname}`);
  }

  let result = parseComment(formData);

  if (!result.ok) {
    let name = formData.get("name");
    let body = formData.get("body");

    session.set("commentDraft", {
      slug,
      name: typeof name === "string" ? name : "",
      body: typeof body === "string" ? body : "",
      errors: result.errors,
    });
    return;
  }

  session.unset("commentDraft");

  await db.create(Comments, {
    post_slug: slug,
    author_name: result.name,
    body: result.body,
  });
}
