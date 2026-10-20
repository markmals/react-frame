import { Frame } from "react-frame";

import { QueryProvider } from "../query/provider.tsx";
import { routes } from "../routes.ts";
import { Document } from "../ui/document.tsx";

/**
 * The shell is the only document route: a left menu frame that outlives every navigation, and a
 * main frame whose route is the list, an issue, or neither. Links carry `data-target="main"`, so
 * moving between them loads one frame instead of the page.
 */
export function Shell({ mainSrc, title }: { mainSrc: string; title: string }) {
  return (
    <Document title={title}>
      <QueryProvider>
        <div className="flex h-dvh overflow-hidden">
          <Frame name="menu" src={routes.frames.menu.href()} />
          <main className="flex min-w-0 flex-1 flex-col">
            {/* No <Suspense>: a boundary that is still pending at the first flush is filled in
                by a script, which leaves the page empty when scripting is off. */}
            <Frame name="main" src={mainSrc} />
          </main>
        </div>
      </QueryProvider>
    </Document>
  );
}
