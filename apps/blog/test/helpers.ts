import * as os from "node:os";
import * as path from "node:path";
import { parseHTML } from "linkedom";
import { Cookie, SetCookie } from "remix/headers";
import { createServer, isRunnableDevEnvironment } from "vite-plus";
import { afterAll } from "vite-plus/test";

import type * as DatabaseModule from "../app/db.ts";
import type * as EntryModule from "../app/entry.server.ts";

// The router renders through @vitejs/plugin-rsc, whose RSC and SSR environments must share a dev
// server, so each test file runs the app on its own server the same way `vp dev` does.
const server = await createServer({
  root: path.resolve(import.meta.dirname, ".."),
  // Test files start in parallel; separate caches keep their dependency optimizers apart.
  cacheDir: path.join(os.tmpdir(), `blog-test-vite-${process.pid}`),
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
});
afterAll(() => server.close());

const environment = server.environments.rsc;
if (!isRunnableDevEnvironment(environment)) {
  throw new Error("Expected the rsc environment to be runnable");
}
const { runner } = environment;

export type TestRouter = typeof EntryModule.default;

/**
 * Imports an app module through the router's module runner, so the test shares its state, such as
 * the in-memory database. Pass the path from the app root: `importApp("/app/db.ts")`.
 */
export function importApp<T>(id: string): Promise<T> {
  return runner.import<T>(id);
}

export async function createTestRouter(): Promise<TestRouter> {
  let { db, loadAppMigrations, loadAppSeed } = await importApp<typeof DatabaseModule>("/app/db.ts");
  await db.reset({ migrations: await loadAppMigrations(), seed: await loadAppSeed() });

  let { default: router } = await importApp<typeof EntryModule>("/app/entry.server.ts");
  return router;
}

export function getSessionCookie(response: Response): string | null {
  for (let header of response.headers.getSetCookie()) {
    let setCookie = new SetCookie(header);
    if (setCookie.name === "session") {
      return setCookie.value ?? null;
    }
  }

  return null;
}

export function requestWithSession(
  url: string,
  sessionCookie: string,
  init?: RequestInit,
): Request {
  let headers = new Headers(init?.headers);
  headers.set("Cookie", new Cookie({ session: sessionCookie }).toString());
  return new Request(url, { ...init, headers });
}

export interface FormSubmission {
  /** Name of the server function the form calls, e.g. `"addComment"`. */
  action: string;
  /** Arguments bound with `.bind()`, to pick one of several forms calling the same function. */
  bound?: unknown[];
  /** Values to enter into the form. `null` removes a field. */
  fields?: Record<string, string | null>;
  /** Session cookie to send with the page request and the submission. */
  session?: string | null;
}

export interface SubmissionResult {
  response: Response;
  /** The session cookie after the submission: the newest one either request set, or the one sent. */
  session: string | null;
}

/**
 * Submits a server function form the way a browser without JavaScript does: loads the page at
 * `url`, fills in the form React rendered there, hidden `$ACTION_*` fields included, and posts it
 * back to `url`.
 */
export async function submitForm(
  router: TestRouter,
  url: string,
  submission: FormSubmission,
): Promise<SubmissionResult> {
  let session = submission.session ?? null;

  let page = await router.fetch(session ? requestWithSession(url, session) : url);
  session = getSessionCookie(page) ?? session;
  if (page.status !== 200) {
    throw new Error(`Expected ${url} to render a page, got ${page.status}`);
  }

  let body = findForm(await page.text(), submission);
  for (let [name, value] of Object.entries(submission.fields ?? {})) {
    if (value === null) body.delete(name);
    else body.set(name, value);
  }

  let init = { method: "POST", body };
  let response = await router.fetch(
    session ? requestWithSession(url, session, init) : new Request(url, init),
  );

  return { response, session: getSessionCookie(response) ?? session };
}

export function parseDocument(html: string) {
  return parseHTML(html).document;
}

function findForm(html: string, submission: FormSubmission): FormData {
  let { document } = parseHTML(html);
  let candidates = [...document.querySelectorAll("form")].flatMap((form) => {
    let serverFunction = readServerFunction(form);
    if (!serverFunction?.id.endsWith(`#${submission.action}`)) return [];
    if (
      submission.bound &&
      JSON.stringify(serverFunction.bound) !== JSON.stringify(submission.bound)
    ) {
      return [];
    }

    return [readFields(form)];
  });

  if (candidates.length !== 1) {
    throw new Error(
      `Expected one form calling ${submission.action}() to match, found ${candidates.length}`,
    );
  }

  return candidates[0]!;
}

// React renders a server function's id into hidden fields: `$ACTION_ID_<id>` when nothing is
// bound, otherwise `$ACTION_REF_<n>` plus encoded `{ id, bound }` metadata in `$ACTION_<n>:*`.
function readServerFunction(form: Element): { id: string; bound: unknown[] } | null {
  let idField = form.querySelector('input[name^="$ACTION_ID_"]');
  if (idField) {
    return { id: idField.getAttribute("name")!.slice("$ACTION_ID_".length), bound: [] };
  }

  let refField = form.querySelector('input[name^="$ACTION_REF_"]');
  if (!refField) return null;

  let prefix = `$ACTION_${refField.getAttribute("name")!.slice("$ACTION_REF_".length)}:`;
  let fieldValue = (part: string) =>
    form.querySelector(`input[name="${prefix}${part}"]`)?.getAttribute("value") ?? "null";
  let metadata = JSON.parse(fieldValue("0")) as { id: string; bound: string | null };
  let boundPart = metadata.bound?.match(/^\$@(\d+)$/)?.[1];

  return {
    id: metadata.id,
    bound: boundPart ? (JSON.parse(fieldValue(boundPart)) as unknown[]) : [],
  };
}

function readFields(form: Element): FormData {
  let body = new FormData();

  for (let field of form.querySelectorAll("input, textarea, select")) {
    let name = field.getAttribute("name");
    if (!name || field.hasAttribute("disabled")) continue;

    if (field.localName === "textarea") {
      body.append(name, field.textContent ?? "");
    } else {
      let type = field.getAttribute("type") ?? "text";
      if (["submit", "button", "reset", "image", "file"].includes(type)) continue;
      body.append(name, field.getAttribute("value") ?? "");
    }
  }

  return body;
}
