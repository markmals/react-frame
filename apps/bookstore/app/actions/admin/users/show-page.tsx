import type { User } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";

export function AdminUserNotFoundPage() {
  return (
    <Layout>
      <div className="card">
        <h1>User Not Found</h1>
      </div>
    </Layout>
  );
}

export function AdminUserShowPage({ user }: { user: User }) {
  return (
    <Layout>
      <h1>User Details</h1>

      <div className="card">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong>{" "}
          <span className={`badge ${user.role === "admin" ? "badge-info" : "badge-success"}`}>
            {user.role}
          </span>
        </p>
        <p>
          <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
        </p>

        <div className="mt-8">
          <a href={routes.admin.users.edit.href({ userId: user.id })} className="btn">
            Edit
          </a>
          <a href={routes.admin.users.index.href()} className="btn btn-secondary ml-2">
            Back to List
          </a>
        </div>
      </div>
    </Layout>
  );
}
