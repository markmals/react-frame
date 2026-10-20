import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";
import { login } from "../actions.ts";
import { CredentialsForm } from "../credentials-form.tsx";
import type { CredentialErrors } from "../schemas.ts";

export function LoginPage({ errors }: { errors?: CredentialErrors }) {
  return (
    <Layout title="Trellix Login">
      <div className="mt-20 flex min-h-full flex-1 flex-col sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2
            id="login-header"
            className="mt-6 text-center text-2xl leading-9 font-bold tracking-tight text-gray-900"
          >
            Log in
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-form">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <CredentialsForm
              action={login}
              errors={errors}
              headingId="login-header"
              passwordAutoComplete="current-password"
              submitLabel="Sign in"
            />

            <p className="mt-6 text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <a className="underline" href={routes.auth.signup.index.href()}>
                Sign up
              </a>
              .
            </p>

            <div className="mt-8 rounded bg-slate-100 p-4 text-sm text-slate-600">
              <p className="font-bold">Demo accounts</p>
              <p>danielle@trellix.dev / trellix123</p>
              <p>marcus@trellix.dev / trellix123</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
