"use client";

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import CatalogTools from "./CatalogTools";
import { Lg } from "@/components/design/Arrow";
import { optimizedImage, originalImage } from "@/lib/image-url";
import type { AlbumLabels, AlbumSpread } from "@/lib/album";

const MOBILE = "(max-width: 767px)";
const subscribeMobile = (notify: () => void) => {
  const query = window.matchMedia(MOBILE);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

/** Falls back to the source file when the resized copy is unavailable. */
function useOriginalOnError() {
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const original = originalImage(img.getAttribute("src") || "");
    if (original) img.src = original;
  };
}

/**
 * The STRIPLINE flip book. Every open spread pairs an atmosphere photo with the product's page;
 * phones get one product page at a time. The pages turn like paper: drag them with the mouse or a
 * finger (or use the contents and "go to page"). Hovering the product photo shows its PDF
 * download, and clicking a product opens its page.
 */
export default function AlbumBook({ spreads, labels, tools = false, start = 0, cta }: { spreads: AlbumSpread[]; labels: AlbumLabels; tools?: boolean; start?: number; cta?: React.ReactNode }) {
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE).matches, () => false);
  const router = useRouter();
  const paper = useRef<PaperBookHandle>(null);
  const [index, setIndex] = useState(start);
  const last = spreads.length - 1;

  const go = useCallback((target: number) => paper.current?.goTo(Math.max(0, Math.min(last, target))), [last]);
  const open = useCallback((spread: number) => { if (spreads[spread]) router.push(`/products/${spreads[spread].slug}`); }, [router, spreads]);

  // Warm the neighbouring spreads so a turn never reveals an empty page.
  useEffect(() => {
    for (const spread of [spreads[index + 1], spreads[index - 1]]) {
      if (!spread) continue;
      new Image().src = optimizedImage(spread.scene, 828);
      new Image().src = optimizedImage(spread.image, 384);
    }
  }, [index, mobile, spreads]);

  if (!spreads.length) return null;
  const current = spreads[index] ?? spreads[0];

  return (
    <div className="album" data-mobile={mobile}>
      {tools && <CatalogTools spreads={spreads} labels={labels} current={index} onGo={go} part={mobile ? "toc" : "both"} />}
      {/* Remounted when the layout changes: a phone shows single pages, a wider screen the open spread. */}
      <PaperBook key={mobile ? "single" : "spread"} ref={paper} spreads={spreads} pdfLabel={labels.pp_pdf} start={index} single={mobile} onIndex={setIndex} onOpen={open} />
      {mobile ? (
        <>
          <div className="book-cap" aria-live="polite">
            <div className="bfam">{current.familyName}</div>
            <h3>{current.name}</h3>
          </div>
          {tools && <CatalogTools spreads={spreads} labels={labels} current={index} onGo={go} part="jump" />}
          {cta}
        </>
      ) : (
        // design: .book-foot — family and product name at the start, the catalogue button at the end
        <div className="book-foot album-foot">
          <div className="book-cap" aria-live="polite">
            <div className="bfam">{current.familyName}</div>
            <h3>{current.name}</h3>
          </div>
          <div className="album-foot-acts">
            {cta}
          </div>
        </div>
      )}
    </div>
  );
}

type PaperBookHandle = { goTo: (spread: number) => void };

/**
 * The pages, mounted once: page-flip moves these nodes itself, so React must not re-render them.
 * page-flip only turns left to right, so the pages are mounted in reverse and the book opens on its
 * last leaf; a spread is then the product page on the left and its photo on the right.
 * `forward` mounts them in reading order instead, for the phone's mirrored deck.
 */
const Pages = memo(function Pages({ spreads, single, pdfLabel, forward = false }: { spreads: AlbumSpread[]; single: boolean; pdfLabel: string; forward?: boolean }) {
  const order = spreads.map((spread, i) => ({ spread, i }));
  if (!forward) order.reverse();
  return (
    <>
      {order.flatMap(({ spread, i }) => [
        <div key={`p-${spread.slug}`} className="sp-page" data-density="soft" data-spread={i}>
          <ProductPage spread={spread} number={i + 1} total={spreads.length} pdfLabel={pdfLabel} sharp={i < 2} withScene={single} />
        </div>,
        ...(single ? [] : [
          <div key={`s-${spread.slug}`} className="sp-page" data-density="soft" data-spread={i}>
            <ScenePage spread={spread} sharp={i < 2} />
          </div>,
        ]),
      ])}
    </>
  );
});

/**
 * The book on page-flip: a portrait single page on phones, the open spread on wider screens.
 * In portrait, page-flip's backward turn is a poor animation, so a phone gets two stacked decks that
 * only ever turn "next": the reversed deck turns back, and a mirrored deck in reading order turns
 * forward. The one not turning is kept on the same page, hidden.
 */
const PaperBook = forwardRef<PaperBookHandle, {
  spreads: AlbumSpread[]; pdfLabel: string; start: number; single: boolean; onIndex: (index: number) => void; onOpen: (spread: number) => void;
}>(function PaperBook({ spreads, pdfLabel, start, single, onIndex, onOpen }, ref) {
  const back = useRef<HTMLDivElement>(null);
  const fwd = useRef<HTMLDivElement>(null);
  // flips[0] is the reversed deck (the only one on wider screens), flips[1] the phone's forward deck.
  const flips = useRef<import("page-flip").PageFlip[]>([]);
  const active = useRef(0);
  // A press that started a fold or a turn is a drag, not a click on the product.
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // Phone swipes are read here only; page-flip's own swipe detection is switched off (swipeDistance).
  const swipe = useRef<{ x: number; y: number; time: number } | null>(null);
  const current = useRef(start);
  const [ready, setReady] = useState(false);
  const count = spreads.length;
  const last = count - 1;
  const pageOf = useCallback((spread: number, deck: number) => (deck === 1 ? spread : single ? last - spread : 2 * (last - spread)), [last, single]);
  // page-flip runs every animated turn through its click check, and `disableFlipByClick` (kept so a
  // tap opens the product) rejects them all in portrait. Lift it for the instant of a deliberate turn.
  const turnTo = useCallback((spread: number) => {
    const decks = flips.current;
    const reading = (pf: import("page-flip").PageFlip) => (pf as unknown as { getState(): string }).getState() === "read";
    if (!decks.length || !decks.every(reading) || spread === current.current) return;
    const deck = decks.length > 1 && spread > current.current ? 1 : 0;
    showDeck([back, fwd], deck);
    active.current = deck;
    const pf = decks[deck];
    const settings = pf.getSettings() as { disableFlipByClick: boolean };
    settings.disableFlipByClick = false;
    try { pf.flip(pageOf(spread, deck)); } finally { settings.disableFlipByClick = true; }
  }, [pageOf]);

  useImperativeHandle(ref, () => ({
    // Ignored mid-turn: page-flip drops a flip() issued while a leaf is still moving.
    goTo: turnTo,
  }), [turnTo]);

  useEffect(() => {
    const els = (single ? [back.current, fwd.current] : [back.current]).filter((el): el is HTMLDivElement => !!el);
    if (!els.length || !count) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const spreadOf = (page: number, deck: number) => Math.max(0, Math.min(last, deck === 1 ? page : single ? last - page : last - Math.floor(page / 2)));
    void import("page-flip").then(({ PageFlip }) => {
      if (cancelled) return;
      const first = Math.max(0, Math.min(last, start));
      current.current = first;
      flips.current = els.map((el, deck) => {
        const pageEls = Array.from(el.querySelectorAll<HTMLElement>(".sp-page"));
        // page-flip removes the element it was given on destroy(), so it gets a disposable host.
        const host = document.createElement("div");
        el.appendChild(host);
        const pf = new PageFlip(host, {
          width: single ? 560 : 600,
          height: single ? 780 : 484,  // design: each page is 1.24 wide to 1 high (.book .leaf)
          size: "stretch",
          minWidth: single ? 240 : 200,
          maxWidth: single ? 1200 : 1500,
          minHeight: single ? 320 : 140,
          maxHeight: single ? 1640 : 1000,
          showCover: false,
          usePortrait: single,
          drawShadow: true,
          maxShadowOpacity: 0.35,
          flippingTime: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 900,
          // Turning is by dragging the page with the mouse; a click on the page is left for opening the
          // product. Phones turn on a swipe (read below): a drag there would pick page-flip's backward turn.
          useMouseEvents: !single,
          disableFlipByClick: true,
          clickEventForward: true,
          mobileScrollSupport: true,
          // page-flip's swipe would turn a second page right after ours (its backward swipe passes the click check).
          swipeDistance: Number.MAX_SAFE_INTEGER,
          showPageCorners: !single,
          startPage: pageOf(first, deck),
          autoSize: true,
        });
        pf.loadFromHTML(pageEls);
        pf.on("flip", (event) => {
          if (deck !== active.current) return; // the hidden deck being kept in step
          current.current = spreadOf(event.data as number, deck);
          onIndex(current.current);
          flips.current.forEach((other, i) => { if (i !== deck) other.turnToPage(pageOf(current.current, i)); });
        });
        pf.on("changeState", (event) => { if (event.data !== "read" && press.current) press.current.moved = true; });
        cleanups.push(() => {
          for (const page of pageEls) {
            page.removeAttribute("style");
            page.classList.remove("stf__item", "--left", "--right", "--simple", "--hard", "--soft");
            el.appendChild(page);
          }
          pf.destroy();
          host.remove();
        });
        return pf;
      });
      active.current = 0;
      showDeck([back, fwd], 0);
      onIndex(first);
      setReady(true);
    });
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      flips.current = [];
      setReady(false);
    };
    // Built once per layout; `start` only sets the page it opens on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreads, single]);

  return (
    <div
      className={single ? "album-phone" : "album-paper"}
      dir="ltr"
      role="group"
      tabIndex={0}
      aria-label="קטלוג מדפדף. גררו את הדף או השתמשו בחיצים כדי לדפדף; לחיצה על מוצר פותחת את העמוד שלו"
      style={{ opacity: ready ? 1 : 0 }}
      onKeyDown={(event) => {
        // Hebrew book: the left arrow turns forward.
        if (event.key === "ArrowLeft") { event.preventDefault(); turnTo(Math.min(last, current.current + 1)); }
        if (event.key === "ArrowRight") { event.preventDefault(); turnTo(Math.max(0, current.current - 1)); }
      }}
      onPointerDownCapture={(event) => { press.current = { x: event.clientX, y: event.clientY, moved: false }; }}
      onTouchStart={(event) => {
        const t = event.touches[0];
        swipe.current = event.touches.length === 1 && t ? { x: t.clientX, y: t.clientY, time: Date.now() } : null;
      }}
      onTouchEnd={(event) => {
        const s = swipe.current;
        const t = event.changedTouches[0];
        swipe.current = null;
        if (!s || !t) return;
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        // A clear sideways swipe; a mostly vertical one is the page scrolling.
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s.time > 800) return;
        // Hebrew book: a swipe from left to right turns forward.
        const target = Math.max(0, Math.min(last, current.current + (dx > 0 ? 1 : -1)));
        if (target !== current.current) turnTo(target);
      }}
      onClick={(event) => {
        const p = press.current;
        press.current = null;
        if (!p || p.moved || Math.hypot(event.clientX - p.x, event.clientY - p.y) > 6) return;
        if ((event.target as HTMLElement).closest("a,button")) return;
        const page = (event.target as HTMLElement).closest<HTMLElement>("[data-spread]");
        if (page) onOpen(Number(page.dataset.spread));
      }}
    >
      {single ? (
        <div className="album-decks">
          <div ref={back}><Pages spreads={spreads} pdfLabel={pdfLabel} single /></div>
          <div ref={fwd} className="album-mirror"><Pages spreads={spreads} pdfLabel={pdfLabel} single forward /></div>
        </div>
      ) : (
        <div ref={back}><Pages spreads={spreads} pdfLabel={pdfLabel} single={false} /></div>
      )}
    </div>
  );
});

/** Shows one of the phone's two stacked decks and hides the other. */
function showDeck(decks: React.RefObject<HTMLDivElement | null>[], visible: number) {
  decks.forEach((deck, i) => { if (deck.current) deck.current.style.visibility = i === visible ? "" : "hidden"; });
}

/** `sharp` loads the photos of the first pages eagerly and larger; the rest load as they are reached. */
function ScenePage({ spread, sharp = false }: { spread: AlbumSpread; sharp?: boolean }) {
  const onError = useOriginalOnError();
  return (
    <span className="album-face album-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedImage(spread.scene, sharp ? 1920 : 828)} alt="" loading={sharp ? "eager" : "lazy"} onError={onError} />
      <span className="album-scene-copy">
        <span className="album-scene-family">{spread.familyName}</span>
        <span className="album-scene-name">{spread.name}</span>
      </span>
    </span>
  );
}

/** `withScene` puts the atmosphere photo above the product, for the phone's single pages. */
function ProductPage({ spread, number, total, pdfLabel, sharp = false, withScene = false }: { spread: AlbumSpread; number: number; total: number; pdfLabel: string; sharp?: boolean; withScene?: boolean }) {
  const onError = useOriginalOnError();
  const detail = spread.materials.slice(0, 2).join(" · ") || spread.sizes[0];
  return (
    <span className="album-face">
      {withScene && (
        <span className="album-phone-scene">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimizedImage(spread.scene, 828)} alt="" loading={sharp ? "eager" : "lazy"} onError={onError} />
        </span>
      )}
      <span className="album-product">
      <span className="album-product-top">
        <span className="album-product-brand" dir="ltr"><Lg /></span>
        <span className="tabular-nums" dir="ltr">{String(total).padStart(2, "0")} / {String(number).padStart(2, "0")}</span>
      </span>
      <span className="album-product-main">
        <span className="album-product-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimizedImage(spread.image, sharp ? 640 : 384)} alt={spread.name} loading={sharp ? "eager" : "lazy"} onError={onError} />
          <a
            href={`/products/${spread.slug}/sheet?download=1`}
            target="_blank"
            rel="noopener"
            className="album-product-pdf"
            onClick={(event) => event.stopPropagation()}
          >
            <Download size={15} aria-hidden="true" /> {pdfLabel}
          </a>
        </span>
        <span className="album-product-copy">
          <span className="album-product-name">{spread.name}</span>
          <span className="album-product-dash" />
          <span className="album-product-desc">{spread.description}</span>
          {detail && <span className="album-product-detail">{detail}</span>}
        </span>
      </span>
      <span className="album-product-foot">
        <span dir="ltr">{spread.familyNameEn}</span>
        <span className="album-product-brand" dir="ltr"><Lg /></span>
      </span>
    </span></span>
  );
}
