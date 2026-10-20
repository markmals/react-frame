import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import { routes } from "../../../routes.ts";
import { getCurrentAccountSafely } from "../../../utils/context.ts";
import { readCredentialErrors } from "../schemas.ts";
import { LoginPage } from "./page.tsx";

// The login form posts to this page's URL, so `returnTo` in the query string carries through to
// the login() server function without a separate form action URL.
export default createController(routes.auth.login, {
  actions: {
    index({ auth, render, session }) {
      if (getCurrentAccountSafely(auth)) {
        return redirect(routes.boards.index.href());
      }

      return render(<LoginPage errors={readCredentialErrors(session.get("credentialErrors"))} />);
    },
  },
});
