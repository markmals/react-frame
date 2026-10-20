"use server";

import { redirect } from "react-frame";
import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { itemsByOrder, orderItemsWithBook, Orders } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { clearCart } from "../../utils/cart.ts";
import { getCurrentCart, getCurrentUser } from "../../utils/context.ts";

const TextField = f.field(s.defaulted(s.string(), ""));
const ShippingAddressSchema = f.object({
  street: TextField,
  city: TextField,
  state: TextField,
  zip: TextField,
});

export async function placeOrder(formData: FormData) {
  let { db, session } = getContext();
  let user = getCurrentUser();
  let cart = getCurrentCart(session);

  if (cart.items.length === 0) {
    redirect(routes.cart.index.href());
    return;
  }

  let shippingAddress = s.parse(ShippingAddressSchema, formData);
  let total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let order = await db.transaction(async (tx) => {
    let createdOrder = await tx.create(
      Orders,
      {
        user_id: user.id,
        total,
        shipping_address_json: JSON.stringify(shippingAddress),
      },
      { returnRow: true },
    );

    await tx.createMany(
      itemsByOrder.targetTable,
      cart.items.map((item) => ({
        order_id: createdOrder.id,
        book_id: item.bookId,
        title: item.title,
        unit_price: item.price,
        quantity: item.quantity,
      })),
    );

    let created = await tx.find(Orders, createdOrder.id, {
      with: { items: orderItemsWithBook },
    });

    if (!created) {
      throw new Error("Failed to load created order");
    }

    return created;
  });

  session.set("cart", clearCart());

  redirect(routes.checkout.confirmation.href({ orderId: order.id }));
}
