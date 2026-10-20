import { render } from "react-frame/spa";
import { createRouter, type Middleware, type RouterContext } from "remix/router";

import rootController from "./actions/controller.tsx";
import framesController from "./actions/frames/controller.tsx";
import notesController from "./actions/notes/controller.tsx";
import { NotFoundPage } from "./actions/pages.tsx";
import { seedWelcomeNotes } from "./data/seed.ts";
import { routes } from "./routes.ts";

// Where a server app loads its database, this app makes sure IndexedDB holds the welcome notes
// before any route reads it. Frame subrequests run it too, so a first visit can't race itself.
const seedOnFirstRun: Middleware = async (_, next) => {
  await seedWelcomeNotes();
  return next();
};

export const router = createRouter({
  middleware: [render(), seedOnFirstRun],
  defaultHandler({ render, url }) {
    return render(<NotFoundPage url={url} />, { status: 404 });
  },
});

export type AppContext = RouterContext<typeof router>;

declare module "remix" {
  interface RouterTypes {
    context: AppContext;
  }
}

router.map(routes, rootController);
router.map(routes.notes, notesController);
router.map(routes.frames, framesController);
