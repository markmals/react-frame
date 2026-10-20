import { Frame } from "react-frame";
import { useFrame } from "react-frame/client";

import { routes } from "../routes.ts";
import { Layout } from "../ui/app-shell.tsx";

interface PageProps {
  url: URL;
}

export function HomePage({ url }: PageProps) {
  return (
    <Layout url={url}>
      <article>
        <p className="mt-0 mb-2 text-xs font-bold tracking-eyebrow text-accent uppercase">Home</p>
        <h1 className="m-0 text-title">A client-only React app</h1>
        <p className="mt-6 max-w-copy text-lg leading-body text-body">
          Route handlers use <code>render()</code> while the SPA runtime preserves the fetch
          router's <code>Request</code>-to-<code>Response</code> contract.
        </p>
        <form
          method="POST"
          action={routes.submitGreet.href()}
          className="mt-8 grid max-w-form gap-3"
        >
          <label htmlFor="name" className="font-bold">
            What should we call you?
          </label>
          <div className="flex gap-3">
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              className="min-w-0 flex-1 rounded-xl border border-field px-3 py-3"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-brand px-4 py-3 font-bold text-white"
            >
              Submit
            </button>
          </div>
        </form>
      </article>
    </Layout>
  );
}

export function AboutPage({ url }: PageProps) {
  return (
    <Layout url={url}>
      <article>
        <p className="mt-0 mb-2 text-xs font-bold tracking-eyebrow text-accent uppercase">About</p>
        <h1 className="m-0 text-title">URLs in, rendered UI out</h1>
        <p className="mt-6 max-w-copy text-lg leading-body text-body">
          Each route waits briefly before returning a SPA response, making page loading and
          cancellation visible without introducing a second navigation system.
        </p>
      </article>
    </Layout>
  );
}

export function NotFoundPage({ url }: PageProps) {
  return (
    <Layout url={url}>
      <article>
        <p className="mt-0 mb-2 text-xs font-bold tracking-eyebrow text-accent uppercase">404</p>
        <h1 className="m-0 text-title">Page not found</h1>
        <p className="mt-6 max-w-copy text-lg leading-body text-body">
          Try going back to the <a href={routes.home.href()}>home page</a>.
        </p>
      </article>
    </Layout>
  );
}

interface GreetingPageProps extends PageProps {
  isSubmission?: boolean;
  name: string;
}

export function GreetingPage({ isSubmission = false, name, url }: GreetingPageProps) {
  // The form posts to this page, so a submission loading this same path is its own. A plain reload
  // of the page has no form data, so it doesn't count.
  let page = useFrame();
  let submitting = page.formData !== undefined && new URL(page.src, url).pathname === url.pathname;

  return (
    <Layout url={url}>
      <article>
        {isSubmission ? (
          <p className="mt-0 mb-2 text-xs font-bold tracking-eyebrow text-accent uppercase">
            Form submitted
          </p>
        ) : null}
        <h1 className="m-0 text-title">Hello, {name}!</h1>
        <p className="mt-6 max-w-copy text-lg leading-body text-body">
          The navigation listener turns the native form navigation into a routed request. Back and
          forward traversals revisit this URL with GET because history entries do not retain form
          data.
        </p>
        <form
          method="POST"
          action={routes.submitGreet.href()}
          className="mt-8 grid max-w-form gap-3"
        >
          <label htmlFor="next-name" className="font-bold">
            Try another name
          </label>
          <div className="flex gap-3">
            <input
              id="next-name"
              name="name"
              autoComplete="name"
              required
              className="min-w-0 flex-1 rounded-xl border border-field px-3 py-3"
            />
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="cursor-pointer rounded-xl bg-brand px-4 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? "Submitting…" : "Submit again"}
            </button>
          </div>
        </form>
        <p className="mt-6 max-w-copy text-lg leading-body text-body">
          This form targets the current URL, so it replaces the active history entry. The first
          submission from <a href={routes.home.href()}>home</a> pushes a new entry.
        </p>
        <Frame src={routes.greetings.href()} />
      </article>
    </Layout>
  );
}
