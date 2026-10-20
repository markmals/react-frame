import { Frame } from "react-server-frame";

import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";

export function CartPage() {
  return (
    <Layout>
      <h1>Shopping Cart</h1>

      <div className="card">
        <Frame name="cart" src={routes.fragments.cartItems.href()} />
      </div>
    </Layout>
  );
}
