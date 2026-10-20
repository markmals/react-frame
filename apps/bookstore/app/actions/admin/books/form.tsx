import type { Book } from "../../../data/schema.ts";
import { Layout } from "../../../ui/layout.tsx";

export interface AdminBookFormPageProps {
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  book?: Book;
}

export function AdminBookFormPage({
  action,
  book,
  cancelHref,
  submitLabel,
  title,
}: AdminBookFormPageProps) {
  return (
    <Layout>
      <h1>{title}</h1>

      <div className="card">
        <form action={action}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input type="text" id="title" name="title" defaultValue={book?.title} required />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input type="text" id="author" name="author" defaultValue={book?.author} required />
          </div>

          <div className="form-group">
            <label htmlFor="slug">Slug (URL-friendly name)</label>
            <input type="text" id="slug" name="slug" defaultValue={book?.slug} required />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              required
              defaultValue={book?.description}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              defaultValue={book?.price}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="genre">Genre</label>
            <input type="text" id="genre" name="genre" defaultValue={book?.genre} required />
          </div>

          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
            <input type="text" id="isbn" name="isbn" defaultValue={book?.isbn} required />
          </div>

          <div className="form-group">
            <label htmlFor="publishedYear">Published Year</label>
            <input
              type="number"
              id="publishedYear"
              name="publishedYear"
              defaultValue={book?.published_year ?? 2024}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="inStock">In Stock</label>
            <select
              id="inStock"
              name="inStock"
              defaultValue={(book?.in_stock ?? true) ? "true" : "false"}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cover">Book Cover Image</label>
            {book && book.cover_url !== "/images/placeholder.jpg" ? (
              <div className="mb-2">
                <img src={book.cover_url} alt={book.title} className="h-auto max-w-50 rounded" />
                <p className="text-sm text-muted">Current cover image</p>
              </div>
            ) : null}
            <input type="file" id="cover" name="cover" accept="image/*" />
            <small className="text-muted">
              {book
                ? "Optional. Upload a new cover image to replace the current one."
                : "Optional. Upload a cover image for this book."}
            </small>
          </div>

          <button type="submit" className="btn">
            {submitLabel}
          </button>
          <a href={cancelHref} className="btn btn-secondary ml-2">
            Cancel
          </a>
        </form>
      </div>
    </Layout>
  );
}
