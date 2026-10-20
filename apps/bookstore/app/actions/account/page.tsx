import type { User } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";

export interface AccountPageProps {
  user: User;
}

export function AccountPage({ user }: AccountPageProps) {
  return (
    <Layout>
      <h1>My Account</h1>

      <div className="card">
        <h2>Account Information</h2>
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}
        </p>

        <p className="mt-6">
          <a href={routes.account.settings.index.href()} className="btn">
            Edit Settings
          </a>
        </p>
      </div>

      <div className="card mt-6">
        <h2>Quick Links</h2>
        <p>
          <a href={routes.account.orders.index.href()} className="btn btn-secondary">
            View Orders
          </a>
          <a href={routes.books.index.href()} className="btn btn-secondary ml-2">
            Browse Books
          </a>
        </p>
      </div>
    </Layout>
  );
}
