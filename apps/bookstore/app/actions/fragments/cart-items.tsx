"use client";

import { startTransition, useOptimistic } from "react";
import { useFrame } from "react-frame/client";

import { routes } from "../../routes.ts";
import { removeCartItem, updateCartItem } from "../cart/api/actions.ts";

type CartItem = {
  bookId: number;
  slug: string;
  title: string;
  price: number;
  quantity: number;
};

type CartItemsProps = {
  items: CartItem[];
  total: number;
  canCheckout: boolean;
};

type PendingAction = { type: "update" | "remove"; bookId: number };

export function CartItems({ items, total, canCheckout }: CartItemsProps) {
  let frame = useFrame();
  // Set inside the transition, so it shows which row is pending until the mutation and the frame's
  // reload finish, then falls back to null by itself.
  let [pendingAction, setPendingAction] = useOptimistic<PendingAction | null>(null);
  let isPending = pendingAction !== null;

  // Without JavaScript the browser submits each form's server function and loads the page again.
  // With it, like the demo, run the mutation and then reload this frame while showing which row
  // is pending.
  let submit = (
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<void>,
    nextAction: PendingAction,
  ) => {
    event.preventDefault();
    if (isPending) return;

    let formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setPendingAction(nextAction);
      await action(formData);
      await frame.reload();
    });
  };

  let totalLabel = isPending ? "---" : `$${total.toFixed(2)}`;

  return (
    <>
      {isPending ? <p className="mb-4 text-caption text-muted">Updating your cart...</p> : null}

      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            let rowAction = pendingAction?.bookId === item.bookId ? pendingAction.type : null;

            return (
              <tr key={item.bookId}>
                <td>
                  <a href={routes.books.show.href({ slug: item.slug })}>{item.title}</a>
                </td>

                <td>${item.price.toFixed(2)}</td>

                <td>
                  <form
                    action={updateCartItem}
                    onSubmit={(event) =>
                      submit(event, updateCartItem, { type: "update", bookId: item.bookId })
                    }
                    className="inline-flex items-center gap-2"
                  >
                    <input type="hidden" name="bookId" value={item.bookId} />

                    <input
                      type="number"
                      name="quantity"
                      defaultValue={item.quantity}
                      min="1"
                      disabled={isPending}
                      className="w-17.5"
                    />

                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn btn-secondary min-w-25 px-2 py-1 text-center text-sm"
                    >
                      {rowAction === "update" ? "Saving..." : "Update"}
                    </button>
                  </form>
                </td>

                <td>${(item.price * item.quantity).toFixed(2)}</td>

                <td>
                  <form
                    action={removeCartItem}
                    onSubmit={(event) =>
                      submit(event, removeCartItem, { type: "remove", bookId: item.bookId })
                    }
                    className="inline"
                  >
                    <input type="hidden" name="bookId" value={item.bookId} />

                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn btn-danger min-w-28 px-2 py-1 text-center text-sm"
                    >
                      {rowAction === "remove" ? "Removing..." : "Remove"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-8 flex items-center gap-4">
        <p className="m-0 mr-auto text-xl font-bold">Total: {totalLabel}</p>

        <a href={routes.books.index.href()} className="btn btn-secondary">
          Continue Shopping
        </a>

        {canCheckout ? (
          <a href={routes.checkout.index.href()} className="btn">
            Proceed to Checkout
          </a>
        ) : (
          <a href={routes.auth.login.index.href()} className="btn">
            Login to Checkout
          </a>
        )}
      </div>
    </>
  );
}
