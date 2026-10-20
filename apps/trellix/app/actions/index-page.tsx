import { routes } from "../routes.ts";
import { Layout } from "../ui/layout.tsx";

export function IndexPage() {
  return (
    <Layout title="Trellix, a react-frame demo">
      <div className="flex h-full flex-col items-center bg-slate-900 pt-20">
        <h1 className="text-5xl font-black text-white">Trellix</h1>

        <div className="mt-8 max-w-md space-y-4 text-lg text-slate-300">
          <p>
            This is a port of{" "}
            <a
              href="https://github.com/remix-run/example-trellix"
              className="text-brand-aqua underline"
            >
              Remix&apos;s Trellix demo
            </a>{" "}
            to react-frame: the same drag-and-drop board, rendered with React Server Components and
            updated through frames.
          </p>
          <p>
            It&apos;s a recreation of the popular drag and drop interface in{" "}
            <a href="https://trello.com" className="underline">
              Trello
            </a>{" "}
            and other similar apps.
          </p>
          <p>If you want to play around, click sign up!</p>
        </div>

        <div className="mt-8 flex w-full max-w-md justify-evenly rounded-3xl bg-slate-800 p-10">
          <a
            href={routes.auth.signup.index.href()}
            className="text-xl font-medium text-brand-aqua underline"
          >
            Sign up
          </a>
          <div className="border-r border-slate-500" />
          <a
            href={routes.auth.login.index.href()}
            className="text-xl font-medium text-brand-aqua underline"
          >
            Login
          </a>
        </div>
      </div>
    </Layout>
  );
}
