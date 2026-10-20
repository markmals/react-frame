import { createController } from "remix/router";

import { orderItemsWithBook, Orders } from "../../data/schema.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { routes } from "../../routes.ts";
import { getCartTotal } from "../../utils/cart.ts";
import { getCurrentCart, getCurrentUser } from "../../utils/context.ts";
import { parseId } from "../../utils/ids.ts";
import { CheckoutPage, EmptyCheckoutPage } from "./checkout-page.tsx";
import { CheckoutConfirmationPage, CheckoutOrderNotFoundPage } from "./confirmation-page.tsx";

export default createController(routes.checkout, {
  middleware: [requireAuth()],
  actions: {
    index({ render, session }) {
      let cart = getCurrentCart(session);
      let total = getCartTotal(cart);

      if (cart.items.length === 0) {
        return render(<EmptyCheckoutPage />);
      }

      return render(<CheckoutPage cart={cart} total={total} />);
    },

    async confirmation({ auth, db, params, render }) {
      let user = getCurrentUser(auth);
      let orderId = parseId(params.orderId);
      let order =
        orderId === undefined
          ? undefined
          : await db.find(Orders, orderId, {
              with: { items: orderItemsWithBook },
            });

      if (!order || order.user_id !== user.id) {
        return render(<CheckoutOrderNotFoundPage />, { status: 404 });
      }

      return render(<CheckoutConfirmationPage order={order} />);
    },
  },
});
