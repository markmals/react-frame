import * as s from "remix/data-schema";
import * as coerce from "remix/data-schema/coerce";
import * as f from "remix/data-schema/form-data";

const TextField = f.field(s.defaulted(s.string(), ""));
const PriceField = f.field(s.defaulted(s.string(), "0"));
const PublishedYearField = f.field(s.defaulted(s.string(), "2024"), {
  name: "publishedYear",
});
const InStockField = f.field(s.defaulted(coerce.boolean(), false), {
  name: "inStock",
});

// `cover` is not part of the schema: it arrives as a File and is stored with saveUpload().
export const BookSchema = f.object({
  slug: TextField,
  title: TextField,
  author: TextField,
  description: TextField,
  price: PriceField,
  genre: TextField,
  isbn: TextField,
  publishedYear: PublishedYearField,
  inStock: InStockField,
});
