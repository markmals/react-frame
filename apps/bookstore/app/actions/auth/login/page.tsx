import { routes } from "../../../routes.ts";
import { Document } from "../../../ui/document.tsx";
import { login } from "../actions.ts";
import { authCardClass } from "../schemas.ts";

export interface LoginPageProps {
  error?: string;
}

export function LoginPage({ error }: LoginPageProps) {
  return (
    <Document>
      <div className={`card ${authCardClass}`}>
        <h1>Login</h1>

        {typeof error === "string" ? <div className="alert alert-error mb-6">{error}</div> : null}

        <form action={login}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn">
            Login
          </button>
        </form>

        <p className="mt-6">
          Don't have an account? <a href={routes.auth.register.index.href()}>Register here</a>
        </p>
        <p>
          <a href={routes.auth.forgotPassword.index.href()}>Forgot password?</a>
        </p>

        <div className="mt-8 rounded bg-panel p-4">
          <p className="text-caption">
            <strong>Demo Accounts:</strong>
          </p>
          <p className="text-caption">Admin: admin@bookstore.com / admin123</p>
          <p className="text-caption">Customer: customer@example.com / password123</p>
        </div>
      </div>
    </Document>
  );
}
