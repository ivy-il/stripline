"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef, type ReactNode } from "react";
import { PageFlip } from "page-flip";

export type FlipBookHandle = { next: () => void; prev: () => void; goTo: (p: number) => void };

type Props = {
  pages: ReactNode[];
  /** Page (single leaf) size in px. The book stretches between min/max. */
  width: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  onFlip?: (page: number, total: number) => void;
  startPage?: number;
  openSpread?: boolean;
  /** Replaces the default click-to-flip, e.g. to open the visible spread enlarged. */
  onSpreadClick?: (page: number) => void;
};

/**
 * Hebrew (right-to-left) flip book built on page-flip.
 * The library is left-to-right only, so the whole book is mirrored with CSS and
 * each page's content is mirrored back. Drag is disabled; navigation is by
 * buttons, click zones, keyboard and swipe – all mapped to RTL reading order.
 */
const FlipBook = forwardRef<FlipBookHandle, Props>(function FlipBook(
  { pages, width, height, minWidth, maxWidth, minHeight, maxHeight, className = "", onFlip, startPage = 0, openSpread = false, onSpreadClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    next: () => bookRef.current?.flipNext(),
    prev: () => bookRef.current?.flipPrev(),
    goTo: (p) => bookRef.current?.flip(p),
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // page-flip moves the page nodes into its own wrapper; keep them so we can
    // hand them back to React on cleanup (StrictMode / re-mount safe).
    const pageEls = Array.from(el.querySelectorAll<HTMLElement>(".book-page"));
    // page-flip removes the element it was given on destroy(), so give it a
    // disposable host instead of React's own node.
    const host = document.createElement("div");
    el.appendChild(host);
    const pf = new PageFlip(host, {
      width,
      height,
      size: "stretch",
      minWidth: minWidth ?? Math.round(width * 0.45),
      maxWidth: maxWidth ?? width,
      minHeight: minHeight ?? Math.round(height * 0.45),
      maxHeight: maxHeight ?? height,
      showCover: !openSpread,
      usePortrait: !openSpread,
      useMouseEvents: false,
      mobileScrollSupport: true,
      maxShadowOpacity: 0.35,
      flippingTime: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 800,
      startPage,
      showPageCorners: false,
    });
    pf.loadFromHTML(pageEls);
    pf.on("flip", (e) => onFlip?.(e.data as number, pf.getPageCount()));
    bookRef.current = pf;
    onFlip?.(pf.getCurrentPageIndex(), pf.getPageCount());
    setReady(true);
    return () => {
      for (const pe of pageEls) {
        pe.removeAttribute("style");
        pe.classList.remove("--left", "--right", "--simple");
        el.appendChild(pe);
      }
      pf.destroy();
      host.remove();
      bookRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]);

  // swipe: visual left->right = next (RTL)
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 0) bookRef.current?.flipNext();
    else bookRef.current?.flipPrev();
  };
  const onClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    if (onSpreadClick) { onSpreadClick(bookRef.current?.getCurrentPageIndex() ?? 0); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) bookRef.current?.flipNext();
    else bookRef.current?.flipPrev();
  };

  return (
    <div
      className={`relative select-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
      style={{ opacity: ready ? 1 : 0, transition: "opacity .4s" }}
    >
      <div ref={containerRef} className="book-mirror">
        {pages.map((p, i) => {
          const hard = !openSpread && (i === 0 || i === pages.length - 1);
          return (
            <div key={i} className={`book-page ${hard ? "hard" : ""}`} data-density={hard ? "hard" : "soft"}>
              <div className="book-page-inner">{p}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default FlipBook;

