import "./app.css";

export interface DocumentProps {
  title?: string;
  children?: React.ReactNode;
}

export function Document({ title = "Trellix", children }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-screen bg-slate-100 font-sans text-slate-900">{children}</body>
    </html>
  );
}
