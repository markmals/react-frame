import { createController } from "remix/router";

import { routes } from "../../../routes.ts";
import { LoginPage } from "./page.tsx";

// The login form posts to this page's URL, so `returnTo` in the query string carries through
// to the login() server function without a separate form action URL.
export default createController(routes.auth.login, {
  actions: {
    index({ render, session }) {
      let error = session.get("error");

      return render(<LoginPage error={typeof error === "string" ? error : undefined} />);
    },
  },
});
