import { routes } from "../../../routes.ts";
import { Document } from "../../../ui/document.tsx";
import { resetPassword } from "../actions.ts";

export interface ResetPasswordPageProps {
  token: string;
  error?: string;
}

export function ResetPasswordPage({ error, token }: ResetPasswordPageProps) {
  return (
    <Document>
      <div className="card mx-auto my-8 max-w-125">
        <h1>Reset Password</h1>
        <p>Enter your new password below.</p>

        {typeof error === "string" ? <div className="alert alert-error mb-6">{error}</div> : null}

        <form action={resetPassword.bind(null, token)}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn">
            Reset Password
          </button>
        </form>
      </div>
    </Document>
  );
}

export function ResetPasswordSuccessPage() {
  return (
    <Document>
      <div className="card mx-auto my-8 max-w-125">
        <div className="alert alert-success">
          Password reset successfully! You can now login with your new password.
        </div>
        <p>
          <a href={routes.auth.login.index.href()} className="btn">
            Login
          </a>
        </p>
      </div>
    </Document>
  );
}
