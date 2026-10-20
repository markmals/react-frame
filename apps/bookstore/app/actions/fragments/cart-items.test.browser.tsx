import { ClientFrame, type ResolveFrame, ResolveFrameContext } from "react-frame/client";
import { beforeEach, describe, expect, it, type Mock, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import { removeCartItem, updateCartItem } from "../cart/api/actions.ts";
import { CartItems } from "./cart-items.tsx";

vi.mock(import("../cart/api/actions.ts"), () => ({
  removeCartItem: vi.fn(),
  updateCartItem: vi.fn(),
}));

let bbq = { bookId: 1, slug: "bbq", title: "Ash & Smoke", price: 16.99, quantity: 1 };
let heavyMetal = {
  bookId: 2,
  slug: "heavy-metal",
  title: "Heavy Metal Guitar Riffs",
  price: 27,
  quantity: 1,
};

let action: PromiseWithResolvers<void>;
let reload: PromiseWithResolvers<React.ReactNode>;
let resolveFrame: Mock<ResolveFrame>;

beforeEach(() => {
  action = Promise.withResolvers();
  reload = Promise.withResolvers();
  resolveFrame = vi.fn<ResolveFrame>(() => reload.promise);
  vi.mocked(updateCartItem).mockReturnValue(action.promise);
  vi.mocked(removeCartItem).mockReturnValue(action.promise);

  render(
    <ResolveFrameContext value={resolveFrame}>
      <ClientFrame src="/fragments/cart-items">
        <CartItems items={[bbq, heavyMetal]} total={43.99} canCheckout={false} />
      </ClientFrame>
    </ResolveFrameContext>,
  );
});

function row(title: string) {
  return page.getByRole("row").filter({ hasText: title });
}

describe("CartItems", () => {
  it("shows the pending update until the cart frame reloads with the new total", async () => {
    await row(heavyMetal.title).getByRole("spinbutton").fill("3");
    await row(heavyMetal.title).getByRole("button", { name: "Update" }).click();

    await expect.element(page.getByText("Updating your cart...")).toBeVisible();
    await expect.element(page.getByText("Total: ---")).toBeVisible();
    await expect
      .element(row(heavyMetal.title).getByRole("button", { name: "Saving..." }))
      .toBeDisabled();
    await expect.element(row(bbq.title).getByRole("button", { name: "Update" })).toBeDisabled();
    let formData = vi.mocked(updateCartItem).mock.calls[0]![0];
    expect([formData.get("bookId"), formData.get("quantity")]).toEqual(["2", "3"]);

    action.resolve();
    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledOnce());
    expect(resolveFrame.mock.calls[0]![0].pathname).toBe("/fragments/cart-items");
    await expect.element(page.getByText("Total: ---")).toBeVisible();

    reload.resolve(
      <CartItems items={[bbq, { ...heavyMetal, quantity: 3 }]} total={97.99} canCheckout={false} />,
    );
    await expect.element(page.getByText("Total: $97.99")).toBeVisible();
    await expect.element(page.getByText("Updating your cart...")).not.toBeInTheDocument();
  });

  it("shows the removing row until the cart frame reloads without it", async () => {
    await row(bbq.title).getByRole("button", { name: "Remove" }).click();

    await expect.element(row(bbq.title).getByRole("button", { name: "Removing..." })).toBeVisible();
    await expect
      .element(row(heavyMetal.title).getByRole("button", { name: "Remove" }))
      .toBeDisabled();
    expect(vi.mocked(removeCartItem).mock.calls[0]![0].get("bookId")).toBe("1");

    action.resolve();
    reload.resolve(<CartItems items={[heavyMetal]} total={27} canCheckout={false} />);

    await expect.element(page.getByText("Total: $27.00")).toBeVisible();
    await expect.element(row(bbq.title)).not.toBeInTheDocument();
  });
});
