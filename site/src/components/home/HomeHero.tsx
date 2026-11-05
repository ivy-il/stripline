"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const MOTION = "(prefers-reduced-motion: reduce)";
const prefersStill = () => window.matchMedia(MOTION).matches;
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** The home hero: the company film plays muted in a loop (the files are set in WordPress). */
export default function HomeHero({ video, videoMobile, poster, children }: { video: string; videoMobile?: string; poster?: string; children: React.ReactNode }) {
  const film = useRef<HTMLVideoElement>(null);
  // A reduced-motion preference keeps the hero still.
  const still = useSyncExternalStore(subscribeMotion, prefersStill, () => false);

  const hero = useRef<HTMLDivElement>(null);
  // The opening screen holds the hero and the categories strip under it (design: --cats-h).
  useEffect(() => {
    const h = hero.current;
    const cats = h?.parentElement?.querySelector<HTMLElement>(".home-hero + .wrap .cats");
    if (!h || !cats) return;
    const set = () => h.style.setProperty("--cats-h", `${cats.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(cats);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const v = film.current;
    if (!v) return;
    if (still) v.pause();
    else v.play().catch(() => {}); // autoplay refused: the poster stays
  }, [still]);

  return (
    <div ref={hero} data-section="home-hero" className="hero home-hero has-video">
      <div className="slides" aria-hidden="true">
        <video
          ref={film}
          className="on"
          muted
          loop
          playsInline
          preload="auto"
          poster={poster || undefined}
          autoPlay={!still}
        >
          {videoMobile && <source src={videoMobile} type="video/mp4" media="(max-width: 900px)" />}
          {video && <source src={video} type="video/mp4" />}
        </video>
      </div>
      {children}
    </div>
  );
}
