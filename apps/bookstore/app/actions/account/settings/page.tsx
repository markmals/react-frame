import type { User } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";
import { updateSettings } from "./actions.ts";

export interface AccountSettingsPageProps {
  user: User;
}

export function AccountSettingsPage({ user }: AccountSettingsPageProps) {
  return (
    <Layout>
      <h1>Account Settings</h1>

      <div className="card">
        <form action={updateSettings}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" defaultValue={user.name} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" defaultValue={user.email} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password (leave blank to keep current)</label>
            <input type="password" id="password" name="password" autoComplete="new-password" />
          </div>

          <button type="submit" className="btn">
            Update Settings
          </button>
          <a href={routes.account.index.href()} className="btn btn-secondary ml-2">
            Cancel
          </a>
        </form>
      </div>
    </Layout>
  );
}
