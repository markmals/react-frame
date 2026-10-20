"use client";

import { startTransition } from "react";
import { useFormStatus } from "react-dom";
import { useFrame } from "react-frame/client";

import { toggleCart } from "../api/actions.ts";

export function CartButton({ inCart, id }: { inCart: boolean; id: string | number; slug: string }) {
  let frame = useFrame();

  return (
    <form
      // Without JavaScript the browser submits this server function and loads the page again.
      action={toggleCart}
      onSubmit={(event) => {
        event.preventDefault();
        let formData = new FormData(event.currentTarget);
        // The form stays pending through the whole transition, so the button reads "Saving..."
        // until its frame shows the new state, plus the demo's extra half second.
        startTransition(async () => {
          await toggleCart(formData);
          await frame.reload();
          let { promise, resolve } = Promise.withResolvers<void>();
          setTimeout(resolve, 500);
          await promise;
        });
      }}
    >
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
