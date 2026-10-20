import { routes } from "../../../routes.ts";
import { Document } from "../../../ui/document.tsx";
import { requestPasswordReset } from "../actions.ts";

export function ForgotPasswordPage() {
  return (
    <Document>
      <div className="card mx-auto my-8 max-w-125">
        <h1>Forgot Password</h1>
        <p>Enter your email address and we'll send you a link to reset your password.</p>

        <form action={requestPasswordReset}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required autoComplete="email" />
          </div>

          <button type="submit" className="btn">
            Send Reset Link
          </button>
        </form>

        <p className="mt-6">
          <a href={routes.auth.login.index.href()}>Back to Login</a>
        </p>
      </div>
    </Document>
  );
}

export function ForgotPasswordSuccessPage({ token }: { token?: string }) {
  return (
    <Document>
      <div className="card mx-auto my-8 max-w-125">
        <div className="alert alert-success">Password reset link sent! Check your email.</div>

        {token ? (
          <div className="mt-4 rounded bg-panel p-4">
            <p className="text-caption">
              <strong>Demo Mode:</strong> Click the link below to reset your password
            </p>
            <p className="mt-2">
              <a
                href={routes.auth.resetPassword.index.href({ token })}
                className="btn btn-secondary"
              >
                Reset Password
              </a>
            </p>
          </div>
        ) : null}

        <p className="mt-6">
          <a href={routes.auth.login.index.href()} className="btn">
            Back to Login
          </a>
        </p>
      </div>
    </Document>
  );
}
