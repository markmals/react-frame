import { ClientFrame, type ResolveFrame, ResolveFrameContext } from "react-frame/client";
import { describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import { addComment } from "./actions.ts";
import { CommentForm } from "./comment-form.tsx";

vi.mock(import("./actions.ts"), () => ({ addComment: vi.fn() }));

const COMMENTS_SRC = "/fragments/comments/sqlite-is-enough";

function renderInFrame(resolveFrame: ResolveFrame, children: React.ReactNode) {
  render(
    <ResolveFrameContext value={resolveFrame}>
      <ClientFrame name="comments" src={COMMENTS_SRC}>
        {children}
      </ClientFrame>
    </ResolveFrameContext>,
  );
}

async function fillIn(name: string, body: string) {
  await page.getByLabelText("Name").fill(name);
  await page.getByLabelText("Comment").fill(body);
}

describe("CommentForm", () => {
  it("stays pending until only the comments frame has reloaded", async () => {
    let action = Promise.withResolvers<void>();
    vi.mocked(addComment).mockReturnValue(action.promise);
    let reload = Promise.withResolvers<React.ReactNode>();
    let resolveFrame = vi.fn<ResolveFrame>(() => reload.promise);

    renderInFrame(resolveFrame, <CommentForm />);
    await fillIn("Wren Abiodun", "WAL plus a busy timeout is the whole trick.");

    let button = page.getByRole("button", { name: "Post comment" });
    await button.click();

    let pending = page.getByRole("button", { name: "Posting…" });
    await expect.element(pending).toBeDisabled();

    let [formData] = vi.mocked(addComment).mock.calls[0]!;
    expect(formData.get("name")).toBe("Wren Abiodun");
    expect(formData.get("body")).toBe("WAL plus a busy timeout is the whole trick.");

    action.resolve();
    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledOnce());
    // The reload went to the comments route and nowhere else, so the article around it stays put.
    expect(resolveFrame.mock.calls[0]![0].pathname).toBe(COMMENTS_SRC);
    expect(resolveFrame.mock.calls[0]![1].method ?? "GET").toBe("GET");

    // Still pending while the frame loads its new content.
    await expect.element(pending).toBeInTheDocument();

    reload.resolve(
      <>
        <p>Wren Abiodun</p>
        <CommentForm />
      </>,
    );
    await expect.element(page.getByText("Wren Abiodun")).toBeInTheDocument();
    await expect.element(page.getByRole("button", { name: "Post comment" })).toBeEnabled();
  });

  it("shows server-side errors inline and keeps what was typed", async () => {
    renderInFrame(
      () => null,
      <CommentForm
        name="A"
        body="Nice."
        errors={{ name: "Please enter a name of at least 2 characters." }}
      />,
    );

    let nameField = page.getByLabelText("Name");
    await expect.element(nameField).toHaveValue("A");
    await expect.element(nameField).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(nameField)
      .toHaveAccessibleDescription("Please enter a name of at least 2 characters.");
    await expect.element(page.getByLabelText("Comment")).toHaveValue("Nice.");
  });
});
