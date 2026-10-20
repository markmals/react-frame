import "./ui/app.css";

import { run } from "react-frame/spa";

import { router } from "./router.tsx";
import { LoadingIndicator } from "./ui/app-shell.tsx";

// `run()` renders the route for the current URL, then resolves every navigation and frame through
// `router` in the browser. The fallback shows until the first route has rendered.
run(router, { container: document.getElementById("root")!, fallback: <LoadingIndicator /> });
