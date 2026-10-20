import type { Order } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";

export function CheckoutOrderNotFoundPage() {
  return (
    <Layout>
      <div className="card">
        <h1>Order Not Found</h1>
        <p>
          <a href={routes.account.orders.index.href()} className="btn">
            View My Orders
          </a>
        </p>
      </div>
    </Layout>
  );
}

export function CheckoutConfirmationPage({ order }: { order: Order }) {
  return (
    <Layout>
      <div className="alert alert-success">
        <h1 className="mb-2">Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been placed successfully.</p>
      </div>

      <div className="card">
        <h2>Order #{order.id}</h2>
        <p>
          <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}
        </p>
        <p>
          <strong>Total:</strong> ${order.total.toFixed(2)}
        </p>
        <p>
          <strong>Status:</strong> <span className="badge badge-info">{order.status}</span>
        </p>

        <p className="mt-8">
          We'll send you a confirmation email shortly. You can track your order status in your
          account.
        </p>

        <div className="mt-8">
          <a href={routes.account.orders.show.href({ orderId: order.id })} className="btn">
            View Order Details
          </a>
          <a href={routes.books.index.href()} className="btn btn-secondary ml-2">
            Continue Shopping
          </a>
        </div>
      </div>
    </Layout>
  );
}
