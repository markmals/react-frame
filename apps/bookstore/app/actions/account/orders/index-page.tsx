import type { Order } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";

export interface AccountOrdersIndexPageProps {
  orders: Order[];
}

export function AccountOrdersIndexPage({ orders }: AccountOrdersIndexPageProps) {
  return (
    <Layout>
      <h1>My Orders</h1>

      <div className="card">
        {orders.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>{order.items.length} item(s)</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-info">{order.status}</span>
                  </td>
                  <td>
                    <a
                      href={routes.account.orders.show.href({ orderId: order.id })}
                      className="btn btn-secondary px-2 py-1 text-sm"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You have no orders yet.</p>
        )}
      </div>

      <p className="mt-6">
        <a href={routes.account.index.href()} className="btn btn-secondary">
          Back to Account
        </a>
      </p>
    </Layout>
  );
}
