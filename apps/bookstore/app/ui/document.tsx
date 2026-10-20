import "./app.css";

export interface DocumentProps {
  title?: string;
  children?: React.ReactNode;
}

export function Document({ title = "Bookstore", children }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
