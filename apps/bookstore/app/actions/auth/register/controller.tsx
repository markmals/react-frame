import { createController } from "remix/router";

import { routes } from "../../../routes.ts";
import { ExistingAccountPage, RegisterPage } from "./page.tsx";

export default createController(routes.auth.register, {
  actions: {
    index({ render, session }) {
      // Flashed by register() when the email is taken; the demo rendered this page from its POST.
      if (session.get("existingAccount")) {
        return render(<ExistingAccountPage />, { status: 400 });
      }

      return render(<RegisterPage />);
    },
  },
});
