import { useState } from "react";
import { Frame } from "react-frame";
import { useFrame } from "react-frame/client";

import { routes } from "../routes.ts";
import { Layout } from "../ui/app-shell.tsx";

const eyebrowClass = "mt-0 mb-2 text-xs font-bold tracking-eyebrow text-accent uppercase";
const titleClass = "m-0 text-title";
const bodyClass = "mt-6 max-w-copy text-lg leading-body text-body";
const formClass = "mt-8 grid max-w-form gap-3";
const inputClass = "min-w-0 flex-1 rounded-xl border border-field px-3 py-3";
const buttonClass =
  "cursor-pointer rounded-xl bg-brand px-4 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-70";

interface PageProps {
  url: URL;
}

export function HomePage({ url }: PageProps) {
  return (
    <Layout url={url}>
      <article>
        <p className={eyebrowClass}>Home</p>
        <h1 className={titleClass}>A client-only React app</h1>
        <p className={bodyClass}>
          Route handlers use <code>render()</code> while the SPA runtime preserves the fetch
          router's <code>Request</code>-to-<code>Response</code> contract.
        </p>
        <form method="POST" action={routes.submitGreet.href()} className={formClass}>
          <label htmlFor="name" className="font-bold">
            What should we call you?
          </label>
          <div className="flex gap-3">
            <input id="name" name="name" autoComplete="name" required className={inputClass} />
            <button type="submit" className={buttonClass}>
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
        <p className={eyebrowClass}>About</p>
        <h1 className={titleClass}>URLs in, rendered UI out</h1>
        <p className={bodyClass}>
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
        <p className={eyebrowClass}>404</p>
        <h1 className={titleClass}>Page not found</h1>
        <p className={bodyClass}>
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
  let page = useFrame();
  let [submitting, setSubmitting] = useState(false);

  // The submission ends when the page has loaded again. React keeps this state across that load
  // because the new page renders the same component in the same place.
  let [wasPending, setWasPending] = useState(page.pending);
  if (wasPending !== page.pending) {
    setWasPending(page.pending);
    if (!page.pending) setSubmitting(false);
  }

  return (
    <Layout url={url}>
      <article>
        {isSubmission ? <p className={eyebrowClass}>Form submitted</p> : null}
        <h1 className={titleClass}>Hello, {name}!</h1>
        <p className={bodyClass}>
          The navigation listener turns the native form navigation into a routed request. Back and
          forward traversals revisit this URL with GET because history entries do not retain form
          data.
        </p>
        <form
          method="POST"
          action={routes.submitGreet.href()}
          onSubmit={() => setSubmitting(true)}
          className={formClass}
        >
          <label htmlFor="next-name" className="font-bold">
            Try another name
          </label>
          <div className="flex gap-3">
            <input id="next-name" name="name" autoComplete="name" required className={inputClass} />
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={buttonClass}
            >
              {submitting ? "Submitting…" : "Submit again"}
            </button>
          </div>
        </form>
        <p className={bodyClass}>
          This form targets the current URL, so it replaces the active history entry. The first
          submission from <a href={routes.home.href()}>home</a> pushes a new entry.
        </p>
        <Frame src={routes.greetings.href()} />
      </article>
    </Layout>
  );
}
