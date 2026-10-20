import { createController } from "remix/router";

import { routes } from "../../routes.ts";
import { ContactPage, ContactSuccessPage } from "./page.tsx";

export default createController(routes.contact, {
  actions: {
    index({ render, session }) {
      // Flashed by sendMessage(); the demo rendered the success page from its POST.
      return session.get("messageSent") ? render(<ContactSuccessPage />) : render(<ContactPage />);
    },
  },
});
