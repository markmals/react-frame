import "./app.css";

import { routes } from "../routes.ts";

export interface DocumentProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Document({ title, description, children }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title === undefined ? "Marginalia" : `${title} — Marginalia`}</title>
        {description === undefined ? null : <meta name="description" content={description} />}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Marginalia"
          href={routes.feed.href()}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
