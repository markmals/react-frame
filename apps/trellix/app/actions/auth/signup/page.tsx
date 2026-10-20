import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";
import { signup } from "../actions.ts";
import { CredentialsForm } from "../credentials-form.tsx";
import type { CredentialErrors } from "../schemas.ts";

export function SignupPage({ errors }: { errors?: CredentialErrors }) {
  return (
    <Layout title="Trellix Signup">
      <div className="mt-20 flex min-h-full flex-1 flex-col sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2
            id="signup-header"
            className="mt-6 text-center text-2xl leading-9 font-bold tracking-tight text-gray-900"
          >
            Sign up
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-form">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <CredentialsForm
              action={signup}
              errors={errors}
              headingId="signup-header"
              passwordAutoComplete="new-password"
              submitLabel="Sign up"
            />

            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{" "}
              <a className="underline" href={routes.auth.login.index.href()}>
                Log in
              </a>
              .
            </p>
          </div>

          <div className="mx-2 mt-8 space-y-2 text-sm text-slate-600">
            <h3 className="font-bold text-black">Privacy Notice</h3>
            <p>
              We won&apos;t use your email address for anything other than authenticating with this
              demo application. This app doesn&apos;t send email anyway, so you can put whatever
              fake email address you want.
            </p>
            <h3 className="font-bold text-black">Terms of Service</h3>
            <p>
              This is a demo app, there are no terms of service. Don&apos;t be surprised if your
              data disappears.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
