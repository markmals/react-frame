import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";

export function AdminDashboardPage() {
  return (
    <Layout>
      <h1>Admin Dashboard</h1>

      <div className="grid grid-cols-dashboard gap-6">
        <div className="card">
          <h2>Manage Books</h2>
          <p>Add, edit, or remove books from the catalog.</p>
          <a href={routes.admin.books.index.href()} className="btn mt-4">
            View Books
          </a>
        </div>

        <div className="card">
          <h2>Manage Users</h2>
          <p>View and manage user accounts.</p>
          <a href={routes.admin.users.index.href()} className="btn mt-4">
            View Users
          </a>
        </div>

        <div className="card">
          <h2>View Orders</h2>
          <p>Monitor and manage customer orders.</p>
          <a href={routes.admin.orders.index.href()} className="btn mt-4">
            View Orders
          </a>
        </div>
      </div>
    </Layout>
  );
}
