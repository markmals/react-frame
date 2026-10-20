import type { Order } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface AccountOrderShowPageProps {
  order: Order;
  shippingAddress: ShippingAddress;
}

export function AccountOrderNotFoundPage() {
  return (
    <Layout>
      <div className="card">
        <h1>Order Not Found</h1>
        <p>
          <a href={routes.account.orders.index.href()} className="btn">
            Back to Orders
          </a>
        </p>
      </div>
    </Layout>
  );
}

export function AccountOrderShowPage({ order, shippingAddress }: AccountOrderShowPageProps) {
  return (
    <Layout>
      <h1>Order #{order.id}</h1>

      <div className="card">
        <p>
          <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}
        </p>
        <p>
          <strong>Status:</strong> <span className="badge badge-info">{order.status}</span>
        </p>

        <h2 className="mt-8">Items</h2>
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
            {order.items.map((item) => (
              <tr key={item.book_id}>
                <td>{item.title}</td>
                <td>{item.quantity}</td>
                <td>${item.unit_price.toFixed(2)}</td>
                <td>${(item.unit_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-bold">
                Total:
              </td>
              <td className="font-bold">${order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <h2 className="mt-8">Shipping Address</h2>
        <p>{shippingAddress.street}</p>
        <p>
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
        </p>
      </div>

      <p className="mt-6">
        <a href={routes.account.orders.index.href()} className="btn btn-secondary">
          Back to Orders
        </a>
      </p>
    </Layout>
  );
}
