import { createController } from "remix/router";

import { routes } from "../../../routes.ts";
import { ForgotPasswordPage, ForgotPasswordSuccessPage } from "./page.tsx";

export default createController(routes.auth.forgotPassword, {
  actions: {
    index({ render, session }) {
      // Flashed by requestPasswordReset(); `token` is present when the email matched an account.
      let sent = session.get("resetLinkSent") as { token?: string } | undefined;
      if (sent) {
        return render(<ForgotPasswordSuccessPage token={sent.token} />);
      }

      return render(<ForgotPasswordPage />);
    },
  },
});
