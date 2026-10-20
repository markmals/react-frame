"use server";

import { redirect } from "react-frame";
import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { PRIORITIES, STATUSES } from "../../data/issue-fields.ts";
import { Comments, Issues } from "../../data/schema.ts";
import { CURRENT_USER } from "../../data/workspace.ts";
import { routes } from "../../routes.ts";

const IssueIdSchema = f.object({ issueId: f.field(s.string()) });

const StatusSchema = f.object({
  issueId: f.field(s.string()),
  status: f.field(s.enum_(STATUSES)),
});

const PrioritySchema = f.object({
  issueId: f.field(s.string()),
  priority: f.field(s.enum_(PRIORITIES)),
});

const ContentSchema = f.object({
  issueId: f.field(s.string()),
  title: f.field(s.defaulted(s.string(), "")),
  description: f.field(s.defaulted(s.string(), "")),
});

const CreateSchema = f.object({
  title: f.field(s.defaulted(s.string(), "")),
  description: f.field(s.defaulted(s.string(), "")),
  status: f.field(s.defaulted(s.enum_(STATUSES), "backlog")),
  priority: f.field(s.defaulted(s.enum_(PRIORITIES), "none")),
  returnTo: f.field(s.defaulted(s.string(), "")),
});

const CommentSchema = f.object({
  issueId: f.field(s.string()),
  body: f.field(s.defaulted(s.string(), "")),
});

export async function createIssue(formData: FormData) {
  let { db } = getContext();
  let { description, priority, returnTo, status, title } = s.parse(CreateSchema, formData);
  let listHref = sameOriginPath(returnTo) ?? routes.issues.href();

  if (title.trim() === "") {
    redirect(`${listHref}${listHref.includes("?") ? "&" : "?"}new=1&error=title`);
    return;
  }

  let now = Date.now();
  await db.create(Issues, {
    title,
    description,
    status,
    priority,
    username: CURRENT_USER,
    created_at: now,
    modified_at: now,
  });

  redirect(listHref);
}

export async function setIssueStatus(formData: FormData) {
  let { db } = getContext();
  let { issueId, status } = s.parse(StatusSchema, formData);
  await db.update(Issues, parseIssueId(issueId), { status });
}

export async function setIssuePriority(formData: FormData) {
  let { db } = getContext();
  let { issueId, priority } = s.parse(PrioritySchema, formData);
  await db.update(Issues, parseIssueId(issueId), { priority });
}

export async function updateIssueContent(formData: FormData) {
  let { db } = getContext();
  let { description, issueId, title } = s.parse(ContentSchema, formData);

  if (title.trim() === "") {
    throw new Error("An issue needs a title.");
  }

  await db.update(Issues, parseIssueId(issueId), { title, description });
}

export async function addComment(formData: FormData) {
  let { db } = getContext();
  let { body, issueId } = s.parse(CommentSchema, formData);

  if (body.trim() === "") {
    throw new Error("A comment needs a body.");
  }

  await db.create(Comments, {
    issue_id: parseIssueId(issueId),
    body,
    username: CURRENT_USER,
    created_at: Date.now(),
  });
}

export async function deleteIssue(formData: FormData) {
  let { db } = getContext();
  let { issueId } = s.parse(IssueIdSchema, formData);
  await db.delete(Issues, parseIssueId(issueId));

  redirect(routes.issues.href());
}

function parseIssueId(issueId: string): number {
  let id = Number.parseInt(issueId, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Not an issue id: ${issueId}`);
  }

  return id;
}

// `returnTo` comes from a hidden field, so it must not be able to send anyone off-site.
function sameOriginPath(value: string): string | undefined {
  return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}
