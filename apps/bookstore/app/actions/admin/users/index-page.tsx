import type { User } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";
import { deleteUser } from "./actions.ts";

export interface AdminUsersIndexPageProps {
  users: User[];
  currentUserId: number;
}

export function AdminUsersIndexPage({ currentUserId, users }: AdminUsersIndexPageProps) {
  return (
    <Layout>
      <h1>Manage Users</h1>

      <p className="mb-4">
        <a href={routes.admin.index.href()} className="btn btn-secondary">
          Back to Dashboard
        </a>
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`badge ${user.role === "admin" ? "badge-info" : "badge-success"}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="actions">
                  <a
                    href={routes.admin.users.edit.href({ userId: user.id })}
                    className="btn btn-secondary px-2 py-1 text-sm"
                  >
                    Edit
                  </a>
                  {user.id !== currentUserId ? (
                    <form action={deleteUser.bind(null, user.id)} className="inline">
                      <button type="submit" className="btn btn-danger px-2 py-1 text-sm">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
