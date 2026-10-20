import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";

export interface CommentErrors {
  name?: string;
  body?: string;
}

/** A rejected submission, kept in the session so the comments frame can show it once. */
export interface CommentDraft {
  slug: string;
  name: string;
  body: string;
  errors: CommentErrors;
}

export type ParsedComment =
  | { ok: true; name: string; body: string }
  | { ok: false; errors: CommentErrors };

const CommentSchema = f.object({
  name: f.field(
    s
      .defaulted(s.string(), "")
      .refine((value) => value.trim().length >= 2, "Please enter a name of at least 2 characters.")
      .refine((value) => value.trim().length <= 60, "Names are limited to 60 characters."),
  ),
  body: f.field(
    s
      .defaulted(s.string(), "")
      .refine((value) => value.trim().length >= 10, "Comments need at least 10 characters.")
      .refine((value) => value.trim().length <= 1000, "Comments are limited to 1000 characters."),
  ),
});

export function parseComment(formData: FormData): ParsedComment {
  let result = s.parseSafe(CommentSchema, formData);

  if (result.success) {
    return { ok: true, name: result.value.name.trim(), body: result.value.body.trim() };
  }

  let errors: CommentErrors = {};

  for (let issue of result.issues) {
    let segment = issue.path?.[0];
    let field = typeof segment === "object" && segment !== null ? segment.key : segment;

    if (field === "name" && errors.name === undefined) errors.name = issue.message;
    if (field === "body" && errors.body === undefined) errors.body = issue.message;
  }

  return { ok: false, errors };
}
