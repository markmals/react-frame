"use client";

import { useFormStatus } from "react-dom";

import { toggleCart } from "../api/actions.ts";

export function CartButton({ inCart, id }: { inCart: boolean; id: string | number; slug: string }) {
  return (
    <form action={toggleCart}>
      <input type="hidden" name="bookId" value={id} />
      <ToggleButton inCart={inCart} />
    </form>
  );
}

function ToggleButton({ inCart }: { inCart: boolean }) {
  let { pending } = useFormStatus();

  return (
    <button type="submit" className="btn">
      {pending ? "Saving..." : inCart ? "Remove from Cart" : "Add to Cart"}
    </button>
  );
}
