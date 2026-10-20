import type { User } from "../../../data/schema.ts";
import { Layout } from "../../../ui/layout.tsx";

export interface AdminUserFormPageProps {
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  user: User;
}

export function AdminUserFormPage({
  action,
  cancelHref,
  submitLabel,
  title,
  user,
}: AdminUserFormPageProps) {
  return (
    <Layout>
      <h1>{title}</h1>

      <div className="card">
        <form action={action}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" defaultValue={user.name} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" defaultValue={user.email} required />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue={user.role}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn">
            {submitLabel}
          </button>
          <a href={cancelHref} className="btn btn-secondary ml-2">
            Cancel
          </a>
        </form>
      </div>
    </Layout>
  );
}
