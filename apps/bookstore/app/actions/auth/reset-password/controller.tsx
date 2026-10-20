import { createController } from "remix/router";

import { routes } from "../../../routes.ts";
import { ResetPasswordPage, ResetPasswordSuccessPage } from "./page.tsx";

export default createController(routes.auth.resetPassword, {
  actions: {
    index({ params, render, session }) {
      // Flashed by resetPassword() after the new password is saved.
      if (session.get("passwordReset")) {
        return render(<ResetPasswordSuccessPage />);
      }

      let token = params.token;
      let error = session.get("error");

      return render(
        <ResetPasswordPage error={typeof error === "string" ? error : undefined} token={token} />,
      );
    },
  },
});
