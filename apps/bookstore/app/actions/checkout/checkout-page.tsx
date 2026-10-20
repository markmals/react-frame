import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";
import type { Cart } from "../../utils/cart.ts";
import { placeOrder } from "./actions.ts";

export interface CheckoutPageProps {
  cart: Cart;
  total: number;
}

export function EmptyCheckoutPage() {
  return (
    <Layout>
      <div className="card">
        <h1>Checkout</h1>
        <p>Your cart is empty. Add some books before checking out.</p>
        <p className="mt-4">
          <a href={routes.books.index.href()} className="btn">
            Browse Books
          </a>
        </p>
      </div>
    </Layout>
  );
}

export function CheckoutPage({ cart, total }: CheckoutPageProps) {
  return (
    <Layout>
      <h1>Checkout</h1>

      <div className="card">
        <h2>Order Summary</h2>
        <table className="mt-4">
          <thead>
            <tr>
              <th>Book</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.bookId}>
                <td>{item.title}</td>
                <td>{item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold">
                Total:
              </td>
              <td className="font-bold">${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card mt-6">
        <h2>Shipping Information</h2>
        <form action={placeOrder}>
          <div className="form-group">
            <label htmlFor="street">Street Address</label>
            <input type="text" id="street" name="street" required />
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input type="text" id="city" name="city" required />
          </div>

          <div className="form-group">
            <label htmlFor="state">State</label>
            <input type="text" id="state" name="state" required />
          </div>

          <div className="form-group">
            <label htmlFor="zip">ZIP Code</label>
            <input type="text" id="zip" name="zip" required />
          </div>

          <button type="submit" className="btn">
            Place Order
          </button>
          <a href={routes.cart.index.href()} className="btn btn-secondary ml-2">
            Back to Cart
          </a>
        </form>
      </div>
    </Layout>
  );
}
