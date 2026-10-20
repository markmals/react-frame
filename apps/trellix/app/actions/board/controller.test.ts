import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  loginAsDanielle,
  loginAsMarcus,
  requestWithSession,
  submitForm,
} from "../../../test/helpers.ts";

const router = await createTestRouter();

const BACKLOG = "c1000000-0000-4000-8000-000000000001";
const IN_PROGRESS = "c1000000-0000-4000-8000-000000000002";
const LAUNCH_POST = "i1000000-0000-4000-8000-000000000001";

function fetchPage(url: string, session: string): Promise<Response> {
  return router.fetch(requestWithSession(url, session));
}

async function columnCards(session: string, columnId: string): Promise<string[]> {
  let response = await fetchPage(`https://trellix.dev/board/1/columns/${columnId}`, session);
  let html = await response.text();
  return [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((match) => match[1]!);
}

describe("board page", () => {
  it("renders the board, its columns, and its cards in one document", async () => {
    let session = await loginAsDanielle(router);
    let html = await (await fetchPage("https://trellix.dev/board/1", session)).text();

    expect(html).toContain("Launch Checklist");
    expect(html).toContain("Backlog");
    expect(html).toContain("In Progress");
    expect(html).toContain("Write the launch post");
    expect(html).toContain("Ship drag and drop");
  });

  it("serves each section as its own frame route", async () => {
    let session = await loginAsDanielle(router);

    let title = await fetchPage("https://trellix.dev/board/1/title", session);
    expect(title.status).toBe(200);
    expect(await title.text()).toContain("Launch Checklist");

    let columns = await fetchPage("https://trellix.dev/board/1/columns", session);
    expect(columns.status).toBe(200);
    let columnsHtml = await columns.text();
    expect(columnsHtml).toContain("Backlog");
    // The columns frame carries its columns' frames, so a reload brings their cards back with it.
    expect(columnsHtml).toContain("Write the launch post");

    let column = await fetchPage(`https://trellix.dev/board/1/columns/${IN_PROGRESS}`, session);
    expect(column.status).toBe(200);
    let columnHtml = await column.text();
    expect(columnHtml).toContain("Ship drag and drop");
    expect(columnHtml).not.toContain("Write the launch post");
  });

  it("hides another account's board and its frames", async () => {
    let marcus = await loginAsMarcus(router);

    for (let url of [
      "https://trellix.dev/board/1",
      "https://trellix.dev/board/1/title",
      "https://trellix.dev/board/1/columns",
      `https://trellix.dev/board/1/columns/${BACKLOG}`,
    ]) {
      expect((await fetchPage(url, marcus)).status, url).toBe(404);
    }
  });

  it("renames the board", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/1", {
      action: "renameBoard",
      fields: { name: "Launch Plan" },
      session,
    });

    expect(response.status).toBe(200);
    expect(await (await fetchPage("https://trellix.dev/board/1/title", session)).text()).toContain(
      "Launch Plan",
    );
  });

  it("renames a column without touching its neighbours", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/1", {
      action: "renameColumn",
      match: { columnId: BACKLOG },
      fields: { name: "Ideas" },
      session,
    });

    expect(response.status).toBe(200);
    let html = await (await fetchPage("https://trellix.dev/board/1/columns", session)).text();

    expect(html).toContain("Ideas");
    expect(html).not.toContain("Backlog");
    expect(html).toContain("In Progress");
  });

  it("adds a column at the end of the board", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/1", {
      action: "createColumn",
      fields: { name: "Blocked" },
      session,
    });

    expect(response.status).toBe(200);
    let html = await (await fetchPage("https://trellix.dev/board/1/columns", session)).text();
    let names = [...html.matchAll(/aria-label="Edit column &quot;([^&]*)&quot; name"/g)].map(
      (match) => match[1]!,
    );

    expect(names.at(-1)).toBe("Blocked");
  });

  it("adds a card to a column and keeps it after a reload", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/1", {
      action: "upsertCard",
      match: { columnId: IN_PROGRESS },
      fields: { id: "card-new", title: "Write release notes", order: "2" },
      session,
    });

    expect(response.status).toBe(200);
    expect(await columnCards(session, IN_PROGRESS)).toEqual([
      "Ship drag and drop",
      "Write release notes",
    ]);
  });

  it("moves a card to another column with a fractional order", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/1", {
      action: "upsertCard",
      match: { columnId: IN_PROGRESS },
      fields: {
        id: LAUNCH_POST,
        columnId: IN_PROGRESS,
        title: "Write the launch post",
        order: "0.5",
      },
      session,
    });

    expect(response.status).toBe(200);
    expect(await columnCards(session, IN_PROGRESS)).toEqual([
      "Write the launch post",
      "Ship drag and drop",
      "Write release notes",
    ]);
    expect(await columnCards(session, BACKLOG)).toEqual([
      "Record the demo video",
      "Audit the keyboard flows",
    ]);
  });

  it("reorders a card inside its column", async () => {
    let session = await loginAsDanielle(router);
    await submitForm(router, "https://trellix.dev/board/1", {
      action: "upsertCard",
      match: { columnId: BACKLOG },
      fields: {
        id: "i1000000-0000-4000-8000-000000000003",
        title: "Audit the keyboard flows",
        order: "1.5",
      },
      session,
    });

    expect(await columnCards(session, BACKLOG)).toEqual([
      "Audit the keyboard flows",
      "Record the demo video",
    ]);
  });

  it("deletes a card", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/1", {
      action: "deleteCard",
      match: { id: "i1000000-0000-4000-8000-000000000002" },
      session,
    });

    expect(response.status).toBe(200);
    expect(await columnCards(session, BACKLOG)).toEqual(["Audit the keyboard flows"]);
  });

  it("refuses card mutations aimed at another account's board", async () => {
    let marcus = await loginAsMarcus(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/3", {
      action: "upsertCard",
      fields: {
        boardId: "1",
        columnId: BACKLOG,
        id: "stolen-card",
        title: "Not yours",
        order: "9",
      },
      session: marcus,
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/boards");

    let danielle = await loginAsDanielle(router);
    expect(await columnCards(danielle, BACKLOG)).not.toContain("Not yours");
  });

  it("refuses to rename another account's column", async () => {
    let marcus = await loginAsMarcus(router);
    let { response } = await submitForm(router, "https://trellix.dev/board/3", {
      action: "renameColumn",
      fields: { boardId: "1", columnId: BACKLOG, name: "Hijacked" },
      session: marcus,
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/boards");

    let danielle = await loginAsDanielle(router);
    let html = await (await fetchPage("https://trellix.dev/board/1/columns", danielle)).text();
    expect(html).not.toContain("Hijacked");
  });

  it("404s a column that belongs to another board", async () => {
    let session = await loginAsDanielle(router);
    let foreign = await fetchPage(
      "https://trellix.dev/board/1/columns/c3000000-0000-4000-8000-000000000001",
      session,
    );

    expect(foreign.status).toBe(404);
  });
});
