"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function uniqueSlides(main: string, gallery: string[]): string[] {
  const out: string[] = [];
  for (const src of [main, ...gallery]) {
    const url = (src || "").trim();
    if (url && !out.includes(url)) out.push(url);
  }
  return out;
}

function Chevron({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      className={mirrored ? "prod-gallery-chev flip" : "prod-gallery-chev"}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M14.5 5.5L8 12l6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Main product photo + optional extra angles from WP. Hero/banner stays elsewhere. */
export default function ProductGallery({
  main,
  gallery = [],
  alt,
}: {
  main: string;
  gallery?: string[];
  alt: string;
}) {
  const extras = useMemo(
    () => (gallery ?? []).map((s) => s.trim()).filter(Boolean),
    [gallery],
  );
  const slides = useMemo(() => uniqueSlides(main, extras), [main, extras]);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const hasExtras = extras.length > 0;
  const current = slides[Math.min(index, slides.length - 1)] || main;

  useEffect(() => {
    setIndex(0);
  }, [main, extras.join("|")]);

  if (!hasExtras || slides.length <= 1) {
    return (
      <div className="prod-ph">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} />
      </div>
    );
  }

  const go = (next: number) => {
    const n = slides.length;
    setIndex(((next % n) + n) % n);
  };

  return (
    <div className="prod-ph prod-ph-gallery">
      <div
        className="prod-gallery"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index + 1);
          if (e.key === "ArrowRight") go(index - 1);
        }}
      >
        <div
          className="prod-gallery-stage"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label={alt}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            if (start == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? start) - start;
            if (Math.abs(dx) < 40) return;
            go(dx > 0 ? index + 1 : index - 1);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="prod-gallery-main" src={current} alt={alt} />
          <div className="prod-gallery-controls">
            <button
              type="button"
              className="prod-gallery-nav"
              aria-label="תמונה קודמת"
              onClick={() => go(index - 1)}
            >
              <Chevron mirrored />
            </button>
            <button
              type="button"
              className="prod-gallery-nav"
              aria-label="תמונה הבאה"
              onClick={() => go(index + 1)}
            >
              <Chevron />
            </button>
          </div>
        </div>

        <ul className="prod-gallery-thumbs" role="list">
          {slides.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className="prod-gallery-thumb"
                aria-label={`${alt}, תמונה ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
