import { createController } from "remix/router";

import { Books } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { getCartTotal } from "../../utils/cart.ts";
import { getCurrentCart, getCurrentUserSafely } from "../../utils/context.ts";
import { parseId } from "../../utils/ids.ts";
import { CartButton } from "./cart-button.tsx";
import { CartItems } from "./cart-items.tsx";

export default createController(routes.fragments, {
  actions: {
    async cartButton({ db, params, render, session }) {
      let bookId = parseId(params.bookId);
      let book = bookId === undefined ? undefined : await db.find(Books, bookId);

      if (!book) {
        return render(<p>Book not found</p>, fragmentResponseInit({ status: 404 }));
      }

      let cart = getCurrentCart(session);
      let inCart = cart.items.some((item) => item.bookId === book.id);

      return render(
        <CartButton inCart={inCart} id={book.id} slug={book.slug} />,
        fragmentResponseInit(),
      );
    },

    cartItems({ auth, render, session }) {
      let cart = getCurrentCart(session);
      let total = getCartTotal(cart);
      let user = getCurrentUserSafely(auth);

      if (cart.items.length === 0) {
        return render(
          <div className="mt-8">
            <p>Your cart is empty.</p>
            <p className="mt-4">
              <a href={routes.books.index.href()} className="btn">
                Browse Books
              </a>
            </p>
          </div>,
          fragmentResponseInit(),
        );
      }

      return render(
        <CartItems items={cart.items} total={total} canCheckout={!!user} />,
        fragmentResponseInit(),
      );
    },
  },
});

function fragmentResponseInit(init?: ResponseInit): ResponseInit {
  let headers = new Headers(init?.headers);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }

  return { ...init, headers };
}
