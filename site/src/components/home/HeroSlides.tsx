"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const INTERVAL = 6000;

/** The hero photos, cross-fading in turn. A single photo (or reduced motion) stays still. */
export default function HeroSlides({ images, alt }: { images: string[]; alt: string }) {
  // Each slide is mounted one step ahead of its turn, so only the first photo competes with the page load.
  const [{ active, mounted }, setSlide] = useState({ active: 0, mounted: Math.min(2, images.length) });

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setSlide((slide) => {
      const next = (slide.active + 1) % images.length;
      return { active: next, mounted: Math.max(slide.mounted, Math.min(images.length, next + 2)) };
    }), INTERVAL);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <>
      {images.slice(0, mounted).map((src, i) => (
        <Image key={src} src={src} alt={i === 0 ? alt : ""} fill priority={i === 0} sizes="100vw" className="home-hero-slide object-cover" data-active={i === active} />
      ))}
    </>
  );
}
