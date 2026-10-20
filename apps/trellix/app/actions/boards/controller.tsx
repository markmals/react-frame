import { createController } from "remix/router";

import { Boards } from "../../data/schema.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { routes } from "../../routes.ts";
import { getCurrentAccount } from "../../utils/context.ts";
import { BoardList } from "./board-list.tsx";
import { BoardsIndexPage } from "./index-page.tsx";

export default createController(routes.boards, {
  middleware: [requireAuth()],
  actions: {
    index({ render }) {
      return render(<BoardsIndexPage />);
    },

    async list({ auth, db, render }) {
      let account = getCurrentAccount(auth);
      let boards = await db.findMany(Boards, {
        where: { account_id: account.id },
        orderBy: ["created_at", "asc"],
      });

      return render(<BoardList boards={boards} />, {
        headers: { "Cache-Control": "no-store" },
      });
    },
  },
});
