"use client";

import { useState } from "react";

export function ImageCarousel({
  images,
  startIndex = 0,
}: {
  images: string[];
  startIndex?: number;
}) {
  let [index, setIndex] = useState(startIndex);

  let total = images.length;
  if (total === 0) return null;
  let current = Math.min(Math.max(index, 0), total - 1);

  return (
    <div className="relative size-full overflow-hidden bg-page">
      <div
        className="flex size-full transition-transform duration-350 ease-out-quint will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={src + i} className="relative h-full min-w-full">
            <img
              src={src}
              alt={`Image ${i + 1} of ${total}`}
              className="pointer-events-none block size-full object-cover select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <button
        aria-label="Previous image"
        disabled={current === 0}
        onClick={() => setIndex(current - 1)}
        className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-white opacity-90 outline-none transition duration-150 disabled:opacity-40"
      >
        <span className="text-icon leading-none">{"‹"}</span>
      </button>

      <button
        aria-label="Next image"
        disabled={current === total - 1}
        onClick={() => setIndex(current + 1)}
        className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-white opacity-90 outline-none transition duration-150 disabled:opacity-40"
      >
        <span className="text-icon leading-none">{"›"}</span>
      </button>
    </div>
  );
}
