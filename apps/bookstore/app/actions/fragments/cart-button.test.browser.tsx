import { ClientFrame, type ResolveFrame, ResolveFrameContext } from "react-server-frame/client";
import { describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import { toggleCart } from "../api/actions.ts";
import { CartButton } from "./cart-button.tsx";

vi.mock(import("../api/actions.ts"), () => ({ toggleCart: vi.fn() }));

describe("CartButton", () => {
  it("reads Saving... until its frame has reloaded, then shows the new state", async () => {
    let action = Promise.withResolvers<void>();
    vi.mocked(toggleCart).mockReturnValue(action.promise);
    let reload = Promise.withResolvers<React.ReactNode>();
    let resolveFrame = vi.fn<ResolveFrame>(() => reload.promise);

    render(
      <ResolveFrameContext value={resolveFrame}>
        <ClientFrame src="/fragments/cart-button/1">
          <CartButton inCart={false} id={1} slug="bbq" />
        </ClientFrame>
      </ResolveFrameContext>,
    );
    let button = page.getByRole("button");
    await expect.element(button).toHaveTextContent("Add to Cart");

    await button.click();
    await expect.element(button).toHaveTextContent("Saving...");
    expect(vi.mocked(toggleCart).mock.calls[0]![0].get("bookId")).toBe("1");

    action.resolve();
    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledOnce());
    expect(resolveFrame.mock.calls[0]![0].pathname).toBe("/fragments/cart-button/1");
    await expect.element(button).toHaveTextContent("Saving...");

    reload.resolve(<CartButton inCart id={1} slug="bbq" />);
    await expect.element(button).toHaveTextContent("Remove from Cart");
  });
});
