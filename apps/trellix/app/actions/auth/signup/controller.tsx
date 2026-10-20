import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import { routes } from "../../../routes.ts";
import { getCurrentAccountSafely } from "../../../utils/context.ts";
import { readCredentialErrors } from "../schemas.ts";
import { SignupPage } from "./page.tsx";

export default createController(routes.auth.signup, {
  actions: {
    index({ auth, render, session }) {
      if (getCurrentAccountSafely(auth)) {
        return redirect(routes.boards.index.href());
      }

      return render(<SignupPage errors={readCredentialErrors(session.get("credentialErrors"))} />);
    },
  },
});
