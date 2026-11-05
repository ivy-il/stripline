"use client";

import { useEffect, useState } from "react";

/* eslint-disable @next/next/no-img-element */
export default function SolFrame({ images }: { images: string[] }) {
  const [on, setOn] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setOn((i) => (i + 1) % images.length), 4000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <figure className="sol-img sol-show" role="img" aria-label="פרויקטים אדריכליים">
      {images.map((src, i) => <img key={src} src={src} alt="" loading={i ? "lazy" : "eager"} decoding="async" className={i === on ? "on" : undefined} />)}
    </figure>
  );
}
