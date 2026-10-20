import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import { routes } from "../routes.ts";
import { getCurrentAccountSafely } from "../utils/context.ts";
import { IndexPage } from "./index-page.tsx";

export default createController(routes, {
  actions: {
    home({ auth, render }) {
      // Trellix sends signed-in visitors straight to their boards.
      if (getCurrentAccountSafely(auth)) {
        return redirect(routes.boards.index.href());
      }

      return render(<IndexPage />);
    },
  },
});
