"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { BOOK_WIDTH, BOOK_HEIGHT, BOOK_SHELL } from "@/lib/book-surface";
import { createAlbumTextures, loadBookImage } from "@/lib/book-textures";
import { createBookLighting } from "@/lib/book-lighting";
import type { BookProjection, BookScene, PrintedSpread } from "@/lib/book-three";
import type { AlbumSpread } from "@/lib/album";

type Controller = { scene: BookScene; prepare: (index: number) => Promise<PrintedSpread>; trim: (index: number) => void };
export type RealisticBookHandle = { goTo: (index: number) => void };
// The whole facing page is one click target (see BookScene.publishProjection).
const FULL_PAGE = [{ u: 0, v: 0, width: 1, height: 1 }];

/**
 * The photographed landscape album with live printed pages: every spread shows a product's
 * page facing its atmosphere photo. Clicking the spread reports it to `onOpen` (the enlarged
 * view); turning is driven by the parent through `goTo`, the keyboard or a swipe.
 */
const RealisticBook = forwardRef<RealisticBookHandle, {
  spreads: AlbumSpread[]; onIndex: (index: number) => void; onOpen: (index: number) => void;
}>(function RealisticBook({ spreads, onIndex, onOpen }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<Controller | null>(null);
  const current = useRef(0);
  const target = useRef(0);
  const busy = useRef(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [turning, setTurning] = useState(false);
  const [failed, setFailed] = useState(false);
  const [projection, setProjection] = useState<BookProjection | null>(null);

  useEffect(() => {
    let alive = true;
    let scene: BookScene | null = null;
    const textures = new Map<number, Promise<PrintedSpread>>();
    const images = new Map<string, ReturnType<typeof loadBookImage>>();
    const imageLoader = (url: string, width?: number) => {
      const key = `${url}@${width ?? ""}`;
      if (!images.has(key)) images.set(key, loadBookImage(url, width));
      return images.get(key)!;
    };
    const disposePair = (pair: PrintedSpread) => { pair.left.dispose(); pair.right.dispose(); };
    async function initialize() {
      const [{ BookScene: Scene }] = await Promise.all([import("@/lib/book-three"), document.fonts.ready]);
      if (!alive || !canvas.current || !spreads.length) return;
      scene = new Scene(canvas.current, (value) => { if (alive) setProjection(value); }, () => {
        if (alive) { setFailed(true); setReady(false); setTurning(false); busy.current = false; }
      });
      const activeScene = scene;
      const font = getComputedStyle(document.body).fontFamily;
      const shell = await imageLoader(BOOK_SHELL);
      if (!alive) return;
      const lighting = shell ? createBookLighting(shell) : undefined;
      const prepare = (n: number) => {
        if (!textures.has(n)) textures.set(n, (async () => {
          const pair = await createAlbumTextures(spreads[n], n, spreads.length, font, lighting, imageLoader);
          if (!alive) throw new Error("Book disposed");
          return { left: activeScene.makeTexture(pair.left), right: activeScene.makeTexture(pair.right) };
        })());
        return textures.get(n)!;
      };
      const trim = (n: number) => {
        for (const [key, pair] of textures) if (Math.abs(key - n) > 1) {
          textures.delete(key);
          void pair.then(disposePair).catch(() => {});
        }
        // Keep the decoded image cache bounded as readers browse the catalog.
        while (images.size > 30) images.delete(images.keys().next().value!);
      };
      const pair = await prepare(0);
      if (!alive) return;
      current.current = 0;
      target.current = 0;
      busy.current = false;
      controller.current = { scene: activeScene, prepare, trim };
      activeScene.show(pair, FULL_PAGE);
      setIndex(0); setTurning(false); setReady(true); setFailed(false);
      if (spreads.length > 1) void prepare(1).catch(() => {});
    }
    void initialize().catch(() => { if (alive) { setFailed(true); setReady(false); } });
    return () => {
      alive = false;
      controller.current = null;
      scene?.dispose();
      textures.forEach((pair) => { void pair.then(disposePair).catch(() => {}); });
      textures.clear();
    };
  }, [spreads]);

  /** Turns one leaf at a time until the book reaches the requested spread. */
  async function advance() {
    const active = controller.current;
    const direction = Math.sign(target.current - current.current) as -1 | 0 | 1;
    if (!active || busy.current || !direction) return;
    const next = current.current + direction;
    busy.current = true;
    setTurning(true);
    try {
      const [from, to] = await Promise.all([active.prepare(current.current), active.prepare(next)]);
      if (controller.current !== active) return;
      active.scene.turn(direction, from, to, FULL_PAGE, () => {
        if (controller.current !== active) return;
        current.current = next;
        busy.current = false;
        setIndex(next); setTurning(false); onIndex(next);
        active.trim(next);
        if (next + direction >= 0 && next + direction < spreads.length) void active.prepare(next + direction).catch(() => {});
        void advance();
      });
    } catch {
      if (controller.current === active) { busy.current = false; setTurning(false); target.current = current.current; }
    }
  }

  function goTo(n: number) {
    target.current = Math.max(0, Math.min(spreads.length - 1, n));
    void advance();
  }
  useImperativeHandle(ref, () => ({ goTo }));

  const spread = spreads[index];
  if (!spread) return null;
  return (
    <div className="real-book real-book-3d" aria-label="ספר הקטלוג" aria-busy={turning}>
      <div
        className="real-book-stage real-book-3d-stage"
        tabIndex={0}
        role="group"
        aria-label="קטלוג מדפדף. חץ שמאלה לכפולה הבאה, חץ ימינה לקודמת, Enter להגדלה"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault(); goTo(target.current + (event.key === "ArrowLeft" ? 1 : -1));
          }
          if (event.key === "Enter") { event.preventDefault(); onOpen(current.current); }
        }}
        onTouchStart={(event) => { suppressClick.current = false; gesture.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={(event) => {
          const start = gesture.current; gesture.current = null;
          if (!start) return;
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { suppressClick.current = true; goTo(target.current + (dx > 0 ? 1 : -1)); }
        }}
        onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BOOK_SHELL} width={BOOK_WIDTH} height={BOOK_HEIGHT} alt="ספר הקטלוג של STRIPLINE" className="real-book-shell real-book-3d-fallback" data-ready={ready} />
        <canvas ref={canvas} className="real-book-canvas real-book-3d-canvas" data-ready={ready} aria-hidden="true" />
        {ready && !turning && projection && (
          <svg className="real-book-links" viewBox={`0 0 ${projection.width} ${projection.height}`} aria-hidden="true">
            <g className="real-book-open" onClick={() => onOpen(current.current)}>
              <path d={projection.left} />
              <path d={projection.products[0] || ""} />
            </g>
          </svg>
        )}
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{failed ? "תצוגה מקדימה" : `${spread.name} · ${index + 1} / ${spreads.length}`}</span>
    </div>
  );
});

export default RealisticBook;
