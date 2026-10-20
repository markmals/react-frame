import { createController } from "remix/router";

import { Users } from "../../../data/schema.ts";
import { requireAdmin } from "../../../middleware/admin.ts";
import { requireAuth } from "../../../middleware/auth.ts";
import { routes } from "../../../routes.ts";
import { getCurrentUser } from "../../../utils/context.ts";
import { parseId } from "../../../utils/ids.ts";
import { updateUser } from "./actions.ts";
import { AdminUserFormPage } from "./form.tsx";
import { AdminUsersIndexPage } from "./index-page.tsx";
import { AdminUserNotFoundPage, AdminUserShowPage } from "./show-page.tsx";

export default createController(routes.admin.users, {
  middleware: [requireAuth(), requireAdmin()],
  actions: {
    async index({ auth, db, render }) {
      let currentUser = getCurrentUser(auth);
      let allUsers = await db.findMany(Users, { orderBy: ["id", "asc"] });

      return render(<AdminUsersIndexPage users={allUsers} currentUserId={currentUser.id} />);
    },

    async show({ db, params, render }) {
      let userId = parseId(params.userId);
      let targetUser = userId === undefined ? undefined : await db.find(Users, userId);

      if (!targetUser) {
        return render(<AdminUserNotFoundPage />, { status: 404 });
      }

      return render(<AdminUserShowPage user={targetUser} />);
    },

    async edit({ db, params, render }) {
      let userId = parseId(params.userId);
      let targetUser = userId === undefined ? undefined : await db.find(Users, userId);

      if (!targetUser) {
        return render(<AdminUserNotFoundPage />, { status: 404 });
      }

      return render(
        <AdminUserFormPage
          title="Edit User"
          action={updateUser.bind(null, targetUser.id)}
          cancelHref={routes.admin.users.index.href()}
          submitLabel="Update User"
          user={targetUser}
        />,
      );
    },
  },
});
