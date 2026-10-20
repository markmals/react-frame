import { get, route, resources } from "remix/routes";

// Mutations are server functions posted to the page that renders their form, so where the
// Remix demo declares form() and POST/PUT/DELETE routes, this map keeps only the GET routes.
export const routes = route({
  uploads: "/uploads/*key",
  fragments: route("fragments", {
    cartButton: get("/cart-button/:bookId"),
    cartItems: get("/cart-items"),
  }),

  // Simple static routes
  home: "/",
  about: "/about",
  contact: { index: get("contact") },
  search: "/search",

  // Public book routes
  books: {
    index: "/books",
    genre: "/books/genre/:genre",
    show: "/books/:slug",
  },

  // Auth routes
  auth: {
    login: { index: get("login") },
    register: { index: get("register") },
    forgotPassword: { index: get("forgot-password") },
    resetPassword: { index: get("reset-password/:token") },
  },

  // Account section (protected, nested routes)
  account: route("account", {
    index: "/",
    settings: { index: get("settings") },

    // Orders as nested resources with custom param
    orders: resources("orders", {
      only: ["index", "show"], // Read-only, no create/edit/delete
      param: "orderId",
    }),
  }),

  // Cart and shopping
  cart: route("cart", {
    index: get("/"),
  }),

  // Checkout flow
  checkout: route("checkout", {
    index: get("/"),
    confirmation: get("/:orderId/confirmation"),
  }),

  // Admin section (protected, showcases CRUD pages on multiple resources)
  admin: route("admin", {
    index: get("/"),

    // Book pages; create, update, and destroy are server functions
    books: resources("books", {
      only: ["index", "new", "show", "edit"],
      param: "bookId",
    }),

    // Users self-register, so there is no new page
    users: resources("users", {
      only: ["index", "show", "edit"],
      param: "userId",
    }),

    // Orders view-only
    orders: resources("orders", {
      only: ["index", "show"],
      param: "orderId",
    }),
  }),
});
