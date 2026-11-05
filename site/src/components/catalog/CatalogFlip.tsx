"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";
import { CATALOG_GRID, CATALOG_PAGES, CATALOG_TOPICS } from "@/lib/catalog";

const TOTAL = CATALOG_PAGES.length;
// page-flip reads left to right, so the pages are handed over last-first: the front cover is the
// last leaf and turning "back" in the library is turning forward in a Hebrew book.
const toLeaf = (page: number) => TOTAL - page;
const toPage = (leaf: number) => TOTAL - leaf;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
/** Pages the reader is at, or a few turns away from, get their image; the rest load on approach. */
const widen = (seen: Set<number>, page: number) => {
  const next = new Set(seen);
  for (let p = page - 4; p <= page + 5; p++) if (p >= 1 && p <= TOTAL) next.add(p);
  return next.size === seen.size ? seen : next;
};

type Props = {
  /** "full" fills the catalogue page; "inline" sits inside the home page section. */
  variant?: "full" | "inline";
  startPage?: number;
};

export default function CatalogFlip({ variant = "full", startPage = 1 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const [leaf, setLeaf] = useState(toLeaf(startPage));
  const [portrait, setPortrait] = useState(false);
  const [ready, setReady] = useState(false);
  const [toc, setToc] = useState(false);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [jump, setJump] = useState("");
  const tocRef = useRef<HTMLDivElement>(null);

  const [near, setNear] = useState<Set<number>>(() => widen(new Set(), startPage));

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const leaves = Array.from(el.querySelectorAll<HTMLElement>(".cf-leaf"));
    // page-flip removes the element it is given on destroy(), so it gets a disposable one.
    const mount = document.createElement("div");
    el.appendChild(mount);
    const room = variant === "full" ? window.innerHeight - 190 : Math.min(window.innerHeight * 0.74, 820);
    const maxHeight = Math.max(420, Math.min(room, 1180));
    const pf = new PageFlip(mount, {
      width: 523,
      height: 740,
      size: "stretch",
      minWidth: 240,
      maxWidth: Math.round((maxHeight * 523) / 740),
      minHeight: 340,
      maxHeight,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: true,
      clickEventForward: true,
      maxShadowOpacity: 0.4,
      flippingTime: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 900,
      startPage: toLeaf(startPage),
      showPageCorners: true,
    });
    pf.on("flip", (e) => {
      setLeaf(e.data as number);
      setNear((s) => widen(s, toPage(e.data as number)));
    });
    pf.on("changeOrientation", (e) => setPortrait(e.data === "portrait"));
    pf.on("init", () => {
      setPortrait(pf.getOrientation() === "portrait");
      setLeaf(pf.getCurrentPageIndex());
      setReady(true);
    });
    pf.loadFromHTML(leaves);
    bookRef.current = pf;
    return () => {
      for (const node of leaves) {
        node.removeAttribute("style");
        node.classList.remove("--left", "--right", "--simple", "--soft", "--hard");
        el.appendChild(node);
      }
      pf.destroy();
      mount.remove();
      bookRef.current = null;
      setReady(false);
    };
  }, [variant, startPage]);

  const next = useCallback(() => bookRef.current?.flipPrev(), []);
  const prev = useCallback(() => bookRef.current?.flipNext(), []);
  const goTo = useCallback((page: number) => {
    const p = Math.min(TOTAL, Math.max(1, Math.round(page)));
    setNear((s) => widen(s, p));
    // The image needs a frame to be in place before the turn starts.
    requestAnimationFrame(() => bookRef.current?.flip(toLeaf(p)));
    setToc(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key === "ArrowLeft") next();
      if (e.key === "ArrowRight") prev();
      if (e.key === "Escape") setToc(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!toc) return;
    const onDown = (e: PointerEvent) => { if (!tocRef.current?.contains(e.target as Node)) setToc(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [toc]);

  const page = toPage(leaf);
  // In a spread the library reports its left leaf: the later page of the two.
  const spread = portrait || page === 1 || page === TOTAL ? [page] : [page - 1, page];
  const label = spread.length === 1 ? `עמוד ${spread[0]} מתוך ${TOTAL}` : `עמודים ${spread[0]}–${spread[1]} מתוך ${TOTAL}`;
  const title = CATALOG_PAGES[spread[0] - 1]?.title;
  // A lone cover sits on one half of the spread; slide the book so it is centred.
  const shift = portrait ? 0 : page === 1 ? 25 : page === TOTAL ? -25 : 0;
  const currentTopic = CATALOG_TOPICS.find((t) => t.items.some((it) => spread.includes(it.page)))?.title;

  const submitJump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(jump);
    if (n >= 1 && n <= TOTAL) goTo(n);
    setJump("");
  };

  return (
    <div className={`cflip cflip-${variant}`} data-ready={ready}>
      <div className="cflip-bar">
        <div className="cflip-toc" ref={tocRef}>
          <button type="button" className="cflip-pill" aria-expanded={toc} aria-controls="cflip-toc" onClick={() => { setToc((v) => !v); setOpenTopic((t) => t ?? currentTopic ?? CATALOG_TOPICS[0].title); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
            תוכן עניינים
          </button>
          {toc && (
            <div className="cflip-panel" id="cflip-toc" role="dialog" aria-label="תוכן עניינים">
              <p className="cflip-panel-h">תוכן עניינים</p>
              <ul>
                {CATALOG_TOPICS.map((topic) => {
                  const open = openTopic === topic.title;
                  return (
                    <li key={topic.title} className={open ? "open" : undefined}>
                      <button type="button" className="cflip-topic" aria-expanded={open} onClick={() => setOpenTopic(open ? null : topic.title)}>
                        <span>{topic.title}</span>
                        <small>{topic.items[0].page}–{topic.items[topic.items.length - 1].page}</small>
                        <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                      {open && (
                        <ul className="cflip-items">
                          {topic.items.map((it) => (
                            <li key={it.page}>
                              <button type="button" onClick={() => goTo(it.page)} aria-current={spread.includes(it.page) ? "page" : undefined}>
                                <span>{it.title}</span><i aria-hidden="true" /><b>{it.page}</b>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <p className="cflip-where" aria-live="polite"><span>{label}</span>{title && <b>{title}</b>}</p>
        <form className="cflip-jump" onSubmit={submitJump}>
          <label htmlFor={`cflip-jump-${variant}`}>מעבר לעמוד</label>
          <input id={`cflip-jump-${variant}`} inputMode="numeric" pattern="[0-9]*" placeholder="עמוד" value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))} />
          <button type="submit" className="cflip-pill">מעבר</button>
        </form>
      </div>

      <div className="cflip-stage">
        <button type="button" className="rnd cflip-arrow cflip-prev" onClick={prev} disabled={page <= 1} aria-label="העמוד הקודם">
          <svg width="20" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M0 6h25M20 1l5 5-5 5" /></svg>
        </button>
        <div className="cflip-book" style={{ transform: `translateX(${shift}%)` }}>
          <div ref={hostRef} className="cflip-host">
            {[...CATALOG_PAGES].reverse().map((p) => (
              <div key={p.n} className="cf-leaf" data-density={p.n === 1 || p.n === TOTAL ? "hard" : "soft"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={near.has(p.n) ? p.src : undefined} alt={`קטלוג STRIPLINE, עמוד ${p.n}: ${p.title}`} draggable={false} />
                {p.hotspots.map((h, i) => {
                  const style = { left: pct(h.x, CATALOG_GRID.w), top: pct(h.y, CATALOG_GRID.h), width: pct(h.w, CATALOG_GRID.w), height: pct(h.h, CATALOG_GRID.h) };
                  return h.slug ? (
                    <Link key={i} href={`/catalog?product=${h.slug}`} className="cf-hot" style={style} aria-label="לצפייה במוצר בקטלוג המדפדף">
                      <span>לצפייה במוצר</span>
                    </Link>
                  ) : (
                    <button key={i} type="button" className="cf-hot cf-hot-row" style={style} onClick={() => h.page && goTo(h.page)} aria-label={`מעבר לעמוד ${h.page}: ${h.label}`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="rnd cflip-arrow cflip-next" onClick={next} disabled={page >= TOTAL} aria-label="העמוד הבא">
          <svg width="20" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M26 6H1M6 1L1 6l5 5" /></svg>
        </button>
      </div>
      <p className="cflip-hint">גררו את פינת הדף או לחצו על החצים כדי לדפדף. לחיצה על מוצר בקטלוג פותחת אותו בקטלוג המדפדף, עם תמונת האווירה ופרטי המוצר.</p>
    </div>
  );
}
