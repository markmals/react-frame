import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";
import { sendMessage } from "./actions.ts";

export function ContactPage() {
  return (
    <Layout>
      <div className="card">
        <h1>Contact Us</h1>
        <p className="my-4">Have a question or feedback? We'd love to hear from you!</p>

        <form action={sendMessage}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" required></textarea>
          </div>

          <button type="submit" className="btn">
            Send Message
          </button>
        </form>
      </div>
    </Layout>
  );
}

export function ContactSuccessPage() {
  return (
    <Layout>
      <div className="alert alert-success">
        Thank you for your message! We'll get back to you soon.
      </div>
      <div className="card">
        <p>
          <a href={routes.home.href()} className="btn">
            Return Home
          </a>
        </p>
      </div>
    </Layout>
  );
}
