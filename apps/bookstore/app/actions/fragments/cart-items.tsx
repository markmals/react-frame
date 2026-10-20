"use client";

import { useActionState, useState } from "react";

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

export function CartItems({ items, total, canCheckout }: CartItemsProps) {
  // useActionState supplies a pending flag shared by every row's form while keeping the forms
  // usable before JavaScript loads. `submittedBookId` says which row the pending action is for.
  let [, update, isUpdating] = useActionState(updateCartItem, null);
  let [, remove, isRemoving] = useActionState(removeCartItem, null);
  let [submittedBookId, setSubmittedBookId] = useState<number | null>(null);

  let isPending = isUpdating || isRemoving;
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
            let isRowSubmitted = submittedBookId === item.bookId;

            return (
              <tr key={item.bookId}>
                <td>
                  <a href={routes.books.show.href({ slug: item.slug })}>{item.title}</a>
                </td>

                <td>${item.price.toFixed(2)}</td>

                <td>
                  <form
                    action={update}
                    onSubmit={() => setSubmittedBookId(item.bookId)}
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
                      {isUpdating && isRowSubmitted ? "Saving..." : "Update"}
                    </button>
                  </form>
                </td>

                <td>${(item.price * item.quantity).toFixed(2)}</td>

                <td>
                  <form
                    action={remove}
                    onSubmit={() => setSubmittedBookId(item.bookId)}
                    className="inline"
                  >
                    <input type="hidden" name="bookId" value={item.bookId} />

                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn btn-danger min-w-28 px-2 py-1 text-center text-sm"
                    >
                      {isRemoving && isRowSubmitted ? "Removing..." : "Remove"}
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
