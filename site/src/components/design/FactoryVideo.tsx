"use client";

import { useRef, useState } from "react";

/** The company film behind a poster and a play button; it loads only once the visitor asks for it. */
export default function FactoryVideo({ src, poster, className, label = "סרטון המפעל של STRIPLINE" }: { src: string; poster?: string; className?: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  if (playing) {
    return (
      <video
        ref={ref}
        className={className}
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        aria-label={label}
      />
    );
  }
  return (
    <button type="button" className={`vid-poster ${className ?? ""}`} onClick={() => setPlaying(true)} aria-label={`הפעלת ${label}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {poster && <img src={poster} alt="" loading="lazy" />}
      <span className="play" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </span>
    </button>
  );
}
