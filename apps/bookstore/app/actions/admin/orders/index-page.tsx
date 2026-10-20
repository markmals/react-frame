import type { Order } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";

export function AdminOrdersIndexPage({ orders }: { orders: Order[] }) {
  return (
    <Layout>
      <h1>Manage Orders</h1>

      <p className="mb-4">
        <a href={routes.admin.index.href()} className="btn btn-secondary">
          Back to Dashboard
        </a>
      </p>

      <div className="card">
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
                    href={routes.admin.orders.show.href({ orderId: order.id })}
                    className="btn btn-secondary px-2 py-1 text-sm"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
