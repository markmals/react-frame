import { routes } from "../../../routes.ts";
import { Document } from "../../../ui/document.tsx";
import { register } from "../actions.ts";

export function RegisterPage() {
  return (
    <Document>
      <div className="card mx-auto my-8 max-w-125">
        <h1>Register</h1>
        <form action={register}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required autoComplete="name" />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn">
            Register
          </button>
        </form>

        <p className="mt-6">
          Already have an account? <a href={routes.auth.login.index.href()}>Login here</a>
        </p>
      </div>
    </Document>
  );
}

export function ExistingAccountPage() {
  return (
    <Document>
      <div className="card mx-auto my-8 max-w-125">
        <div className="alert alert-error">An account with this email already exists.</div>
        <p>
          <a href={routes.auth.register.index.href()} className="btn">
            Back to Register
          </a>
          <a href={routes.auth.login.index.href()} className="btn btn-secondary ml-2">
            Login
          </a>
        </p>
      </div>
    </Document>
  );
}
