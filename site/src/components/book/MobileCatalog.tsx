"use client";

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heebo } from "next/font/google";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageFlip } from "page-flip";
import { optimizedImage } from "@/lib/image-url";
import type { AlbumSpread, PhoneBook } from "@/lib/album";
import { buildLeaves, LeafView, type Leaf } from "./MobileCatalogPages";

const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["300", "400", "500", "600", "700", "800"], display: "swap" });

const PILL = "whitespace-nowrap rounded-full border border-[var(--stage-line)] text-[var(--ink-muted)] transition-colors hover:text-[var(--brass)]";

export type MobileCatalogHandle = { goToSpread: (spread: number) => void };

/** Decodes the full-page images up front so the book never opens on a blank leaf. */
function preload(sources: string[]) {
  return Promise.all(sources.map((src) => new Promise<void>((resolve) => {
    const img = new Image();
    img.src = src;
    img.decode().then(() => resolve(), () => resolve());
  })));
}

/**
 * The phone catalogue: a portrait flip book, one page per screen. Covers and opening pages come from the WordPress settings, and every product gets
 * a page. A sideways swipe turns the page; touching a product page opens it enlarged (`onOpen`), exactly like the desktop album.
 */
const MobileCatalog = forwardRef<MobileCatalogHandle, { spreads: AlbumSpread[]; book: PhoneBook; onOpen: (spread: number) => void }>(
function MobileCatalog({ spreads, book, onOpen }, ref) {
  const leaves = useMemo(() => buildLeaves(book, spreads), [book, spreads]);
  const count = leaves.length;
  const signature = leaves.map((leaf) => leaf.id).join("|");
  const container = useRef<HTMLDivElement>(null);
  const flip = useRef<PageFlip | null>(null);
  const press = useRef<{ x: number; y: number; at: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [portrait, setPortrait] = useState(true);
  const [zoomSrc, setZoomSrc] = useState<{ src: string; title: string } | null>(null);

  const reading = () => (flip.current as unknown as { getState(): string } | null)?.getState() === "read";

  const goTo = useCallback((target: number) => {
    // Ignored mid-turn: page-flip drops a flip() issued while a leaf is still moving.
    if (!flip.current || !reading() || target < 0) return;
    // page-flip only turns left-to-right, so the leaves are mounted in reverse and the book opens on its last one.
    flip.current.flip(count - 1 - Math.min(target, count - 1));
  }, [count]);

  useImperativeHandle(ref, () => ({
    goToSpread: (spread) => goTo(leaves.findIndex((leaf) => leaf.kind === "product" && leaf.spreadIndex === spread)),
  }), [goTo, leaves]);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let cancelled = false;
    let cleanup = () => {};
    preload(leaves.flatMap((leaf) => "src" in leaf ? [leaf.src] : [])).then(() => {
      if (cancelled) return;
      const pageEls = Array.from(el.querySelectorAll<HTMLElement>(".sp-page"));
      // page-flip removes the element it was given on destroy(), so it gets a disposable host.
      const host = document.createElement("div");
      el.appendChild(host);
      const pf = new PageFlip(host, {
        width: 595,
        height: 842,
        size: "stretch",
        minWidth: window.innerWidth < 768 ? 280 : 180,
        maxWidth: 1400,
        minHeight: 254,
        maxHeight: 1980,
        showCover: true,
        usePortrait: true,
        drawShadow: true,
        maxShadowOpacity: 0.35,
        flippingTime: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 900,
        // page-flip's own touch handling is off: it blocks the page from scrolling and would turn on
        // every touch. Swipes and touches are read on the wrapper instead (see onPointerUp).
        useMouseEvents: false,
        showPageCorners: false,
        startPage: pageEls.length - 1,
        autoSize: true,
      });
      pf.loadFromHTML(pageEls);
      flip.current = pf;
      const syncOrientation = () => setPortrait(pf.getOrientation() === "portrait");
      pf.on("flip", (event) => setIndex(Math.max(0, pageEls.length - 1 - (event.data as number))));
      pf.on("changeOrientation", syncOrientation);
      pf.on("init", syncOrientation);
      syncOrientation();
      setIndex(0);
      setReady(true);
      cleanup = () => {
        for (const page of pageEls) {
          page.removeAttribute("style");
          page.classList.remove("stf__item", "--left", "--right", "--simple", "--hard", "--soft");
          el.appendChild(page);
        }
        pf.destroy();
        host.remove();
        flip.current = null;
        setReady(false);
      };
    });
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Hidden leaves load nothing, so the next pages' photos are fetched ahead of the turn.
  useEffect(() => {
    for (const leaf of [leaves[index + 1], leaves[index + 2], leaves[index - 1]]) {
      if (leaf?.kind !== "product") continue;
      new Image().src = optimizedImage(leaf.spread.scene, 828);
      new Image().src = optimizedImage(leaf.spread.image, 384);
    }
  }, [index, leaves]);

  const prev = useCallback(() => flip.current?.flipNext(), []);
  const next = useCallback(() => flip.current?.flipPrev(), []);

  const open = useCallback((leaf: Leaf | undefined) => {
    if (!leaf) return;
    if (leaf.kind === "product") onOpen(leaf.spreadIndex);
    else if ("src" in leaf) setZoomSrc({ src: leaf.src, title: leaf.title });
  }, [onOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.tagName === "INPUT") return;
      if (event.key === "ArrowLeft") next();
      if (event.key === "ArrowRight") prev();
      if (event.key === "Escape") setZoomSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Wide phones held sideways show a spread: the covers sit alone and are nudged to the middle.
  const atCover = index === 0;
  let shown = [index];
  if (!portrait && !atCover) {
    const first = index % 2 === 1 ? index : index - 1;
    shown = [first, first + 1].filter((n) => n < count);
  }
  const atBack = !portrait && shown.length === 1 && !atCover;
  const shift = !portrait && atCover ? "translateX(25%)" : atBack ? "translateX(-25%)" : "translateX(0)";
  const scope = `mcat ${heebo.className}`;

  return (
    <div className={`${scope} flex flex-col bg-[var(--stage)]`} dir="rtl">
      <header className="flex items-center justify-center border-b border-[var(--stage-line)] px-4 py-3">
        <div className="text-sm font-light tracking-[0.35em] text-[var(--ink-foreground)]">STRIP<span className="font-semibold">LINE</span></div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-3 py-5">
        {!ready && <div className="absolute text-sm tracking-[0.3em] text-[var(--ink-muted)]">טוען קטלוג…</div>}
        <div
          dir="ltr"
          className="touch-pan-y select-none transition-transform duration-700 ease-out"
          style={{ width: "min(100%, calc((100dvh - 10rem) * 0.7071))", transform: shift, opacity: ready ? 1 : 0, ...(ready ? null : { aspectRatio: "595 / 842", overflow: "hidden" }) }}
          onPointerDown={(event) => { press.current = { x: event.clientX, y: event.clientY, at: event.timeStamp }; }}
          onPointerCancel={() => { press.current = null; }}
          onPointerUp={(event) => {
            const start = press.current; press.current = null;
            const target = event.target as HTMLElement;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            // A sideways drag turns the page; the leaf follows the finger's direction, as in a Hebrew book.
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { if (dx > 0) next(); else prev(); return; }
            if (event.timeStamp - start.at > 500 || Math.hypot(dx, dy) > 10 || target.closest("a,button")) return;
            if (reading()) open(leaves[Number(target.closest<HTMLElement>("[data-leaf]")?.dataset.leaf ?? -1)]);
          }}
        >
          <Leaves containerRef={container} leaves={leaves} book={book} onGoto={goTo} />
        </div>
      </main>

      <footer className="flex items-center justify-center gap-5 border-t border-[var(--stage-line)] px-4 py-3">
        <button type="button" onClick={prev} aria-label="עמוד קודם" className={`p-2 ${PILL}`}><ChevronRight className="h-4 w-4" /></button>
        {/* Written total-first inside an LTR run, so in the Hebrew page it reads "current / total". */}
        <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-[var(--ink-muted)]" dir="ltr" aria-live="polite" aria-label={`עמוד ${shown[shown.length - 1] + 1} מתוך ${count}`}>
          {count} / {shown.map((n) => n + 1).reverse().join("–")}
        </span>
        <button type="button" onClick={next} aria-label="עמוד הבא" className={`p-2 ${PILL}`}><ChevronLeft className="h-4 w-4" /></button>
      </footer>

      {/* In a portal: ancestors with transforms or size containment would trap a fixed overlay. */}
      {zoomSrc && createPortal(
        <div className={`${scope} fixed inset-0 z-[95] overflow-auto bg-slate-950`} role="dialog" aria-modal="true" aria-label={zoomSrc.title}>
          <button type="button" onClick={() => setZoomSrc(null)} aria-label="סגור" className="fixed left-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white backdrop-blur">
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomSrc.src} alt={zoomSrc.title} className="w-[250%] max-w-none" />
        </div>,
        document.body,
      )}
    </div>
  );
});

export default MobileCatalog;

/** Memoised: page-flip owns these nodes once mounted, so React must not re-render them on every turn. */
const Leaves = memo(function Leaves({ containerRef, leaves, book, onGoto }: {
  containerRef: React.RefObject<HTMLDivElement | null>; leaves: Leaf[]; book: PhoneBook; onGoto: (index: number) => void;
}) {
  return (
    <div ref={containerRef}>
      {[...leaves].reverse().map((leaf, i) => {
        const index = leaves.length - 1 - i;
        const hard = index === 0 || index === leaves.length - 1;
        return (
          <div key={leaf.id} className="sp-page bg-white" data-density={hard ? "hard" : "soft"} data-leaf={index}>
            <div className="h-full w-full overflow-hidden" dir="rtl" style={{ containerType: "inline-size" }}>
              <LeafView leaf={leaf} leaves={leaves} book={book} pageNumber={index + 1} onGoto={onGoto} />
            </div>
          </div>
        );
      })}
    </div>
  );
});
