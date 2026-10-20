import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  loginAsDanielle,
  loginAsMarcus,
  requestWithSession,
  submitForm,
} from "../../../test/helpers.ts";

const router = await createTestRouter();

async function boardsPage(session: string): Promise<string> {
  let response = await router.fetch(requestWithSession("https://trellix.dev/boards", session));
  return response.text();
}

describe("boards", () => {
  it("lists only the signed-in account's boards", async () => {
    let danielle = await boardsPage(await loginAsDanielle(router));
    let marcus = await boardsPage(await loginAsMarcus(router));

    expect(danielle).toContain("Launch Checklist");
    expect(danielle).toContain("Reading Queue");
    expect(danielle).not.toContain("Marcus Only");

    expect(marcus).toContain("Marcus Only");
    expect(marcus).not.toContain("Launch Checklist");
  });

  it("creates a board, opens it, and lists it afterwards", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/boards", {
      action: "createBoard",
      fields: { name: "Roadmap", color: "#6bd968" },
      session,
    });

    expect(response.status).toBe(303);
    let location = response.headers.get("Location")!;
    expect(location).toMatch(/^\/board\/\d+$/);

    let board = await router.fetch(requestWithSession(`https://trellix.dev${location}`, session));

    expect(board.status).toBe(200);
    expect(await board.text()).toContain("Roadmap");
    expect(await boardsPage(session)).toContain("Roadmap");
  });

  it("deletes a board", async () => {
    let session = await loginAsDanielle(router);
    let { response } = await submitForm(router, "https://trellix.dev/boards", {
      action: "deleteBoard",
      match: { boardId: "2" },
      session,
    });

    expect(response.status).toBe(200);
    expect(await boardsPage(session)).not.toContain("Reading Queue");

    let deleted = await router.fetch(requestWithSession("https://trellix.dev/board/2", session));
    expect(deleted.status).toBe(404);
  });

  it("will not delete a board belonging to another account", async () => {
    let marcus = await loginAsMarcus(router);
    let { response } = await submitForm(router, "https://trellix.dev/boards", {
      action: "deleteBoard",
      match: { boardId: "3" },
      fields: { boardId: "1" },
      session: marcus,
    });

    expect(response.status).toBe(200);

    let danielle = await loginAsDanielle(router);
    expect(await boardsPage(danielle)).toContain("Launch Checklist");
  });

  it("loads the board list as a frame of its own", async () => {
    let session = await loginAsDanielle(router);
    let list = await router.fetch(requestWithSession("https://trellix.dev/boards/list", session));
    let html = await list.text();

    expect(list.status).toBe(200);
    expect(html).toContain("Launch Checklist");
    // A frame renders the section only; the page's chrome stays where it is.
    expect(html).not.toContain("New Board");
  });
});
