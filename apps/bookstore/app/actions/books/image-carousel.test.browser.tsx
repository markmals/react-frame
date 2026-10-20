import { describe, expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import { ImageCarousel } from "./image-carousel.tsx";

const images = ["/images/bbq-1.png", "/images/bbq-2.png", "/images/bbq-3.png"];

describe("ImageCarousel", () => {
  it("moves between images and stops at either end", async () => {
    render(<ImageCarousel images={images} />);
    let previous = page.getByRole("button", { name: "Previous image" });
    let next = page.getByRole("button", { name: "Next image" });

    await expect.element(previous).toBeDisabled();
    await expect.element(next).toBeEnabled();

    await next.click();
    await expect.element(previous).toBeEnabled();

    await next.click();
    await expect.element(next).toBeDisabled();

    await previous.click();
    await expect.element(next).toBeEnabled();
  });

  it("slides the track to the current image", async () => {
    render(<ImageCarousel images={images} startIndex={1} />);
    let firstImage = page.getByRole("img", { name: "Image 1 of 3" });
    await expect.element(firstImage).toBeInTheDocument();
    let track = firstImage.element().parentElement!.parentElement!;

    await expect.element(track).toHaveStyle({ transform: "translateX(-100%)" });

    await page.getByRole("button", { name: "Next image" }).click();
    await expect.element(track).toHaveStyle({ transform: "translateX(-200%)" });
  });

  it("renders nothing without images", async () => {
    render(<ImageCarousel images={[]} />);

    await expect.element(page.getByRole("button", { name: "Next image" })).not.toBeInTheDocument();
  });
});
