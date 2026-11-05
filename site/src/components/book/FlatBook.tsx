"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createFlatAlbumTextures, loadBookImage } from "@/lib/book-textures";
import { PAPER_WIDTH } from "@/lib/book-lighting";
import type { FlatBookScene, PrintedSpread } from "@/lib/flat-book-three";
import type { AlbumSpread } from "@/lib/album";

type Controller = { scene: FlatBookScene; prepare: (index: number) => Promise<PrintedSpread>; trim: (index: number) => void };
export type FlatBookHandle = { goTo: (index: number) => void };

/**
 * The photographed album with live paper: each spread is printed onto sheets that bend and
 * lift over the binding when turned. Clicking the book reports the open spread to `onOpen`;
 * turning is driven by the parent through `goTo`, the keyboard or a swipe.
 */
const FlatBook = forwardRef<FlatBookHandle, {
  spreads: AlbumSpread[]; start?: number; onIndex: (index: number) => void; onOpen: (index: number) => void; onFail: () => void;
  /** The open spread as real HTML. It covers the canvas while the book rests, because browser text is
   * sharper than text printed on a WebGL sheet; the canvas takes over for the turn. */
  children?: React.ReactNode;
}>(function FlatBook({ spreads, start = 0, onIndex, onOpen, onFail, children }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<Controller | null>(null);
  const current = useRef(0);
  const target = useRef(0);
  const busy = useRef(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [ready, setReady] = useState(false);
  const [turning, setTurning] = useState(false);

  useEffect(() => {
    let alive = true;
    let scene: FlatBookScene | null = null;
    const textures = new Map<number, Promise<PrintedSpread>>();
    const images = new Map<string, ReturnType<typeof loadBookImage>>();
    const imageLoader = (url: string, width?: number) => {
      const key = `${url}@${width ?? ""}`;
      if (!images.has(key)) images.set(key, loadBookImage(url, width));
      return images.get(key)!;
    };
    const disposePair = (pair: PrintedSpread) => { pair.left.dispose(); pair.right.dispose(); };
    const fail = () => { if (alive) onFail(); };
    async function initialize() {
      const [{ FlatBookScene: Scene, flatPixelRatio }] = await Promise.all([import("@/lib/flat-book-three"), document.fonts.ready]);
      if (!alive || !canvas.current || !spreads.length) return;
      scene = new Scene(canvas.current, fail);
      const activeScene = scene;
      const font = getComputedStyle(document.body).fontFamily;
      // Print each page at the size it is shown, so the type is not resampled into a blur.
      const pageWidth = (canvas.current.parentElement?.clientWidth ?? 1200) / 2;
      // Capped so a page never exceeds the 4096px texture size every GPU supports.
      const scale = Math.min(3.7, Math.max(.5, pageWidth * flatPixelRatio() * 1.02 / PAPER_WIDTH));
      // Photos follow the real screen density; only the type gains from the extra pixels.
      const photoScale = pageWidth * Math.min(window.devicePixelRatio || 1, 2) / PAPER_WIDTH;
      const prepare = (n: number) => {
        if (!textures.has(n)) textures.set(n, (async () => {
          const pair = await createFlatAlbumTextures(spreads[n], n, spreads.length, font, scale, imageLoader, photoScale);
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
      const first = Math.max(0, Math.min(spreads.length - 1, start));
      const pair = await prepare(first);
      if (!alive) return;
      current.current = first;
      target.current = first;
      busy.current = false;
      controller.current = { scene: activeScene, prepare, trim };
      activeScene.show(pair);
      setTurning(false); setReady(true);
      onIndex(first);
      if (first + 1 < spreads.length) void prepare(first + 1).catch(() => {});
    }
    void initialize().catch(fail);
    return () => {
      alive = false;
      controller.current = null;
      scene?.dispose();
      textures.forEach((pair) => { void pair.then(disposePair).catch(() => {}); });
      textures.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreads]);

  /** Turns to the requested spread. A jump across several spreads (search, contents) is a single
   * turn straight to it, so the reader does not wait through every page in between. */
  async function advance() {
    const active = controller.current;
    const direction = Math.sign(target.current - current.current) as -1 | 0 | 1;
    if (!active || busy.current || !direction) return;
    const next = Math.abs(target.current - current.current) > 1 ? target.current : current.current + direction;
    busy.current = true;
    setTurning(true);
    try {
      const [from, to] = await Promise.all([active.prepare(current.current), active.prepare(next)]);
      if (controller.current !== active) return;
      active.scene.turn(direction, from, to, () => {
        if (controller.current !== active) return;
        current.current = next;
        busy.current = false;
        setTurning(false); onIndex(next);
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

  return (
    <div
      className="album-shell"
      tabIndex={0}
      role="group"
      aria-label="קטלוג מדפדף. חץ שמאלה לכפולה הבאה, חץ ימינה לקודמת, Enter להגדלה"
      aria-busy={turning}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); goTo(target.current + (event.key === "ArrowLeft" ? 1 : -1));
        }
        if (event.key === "Enter") { event.preventDefault(); onOpen(current.current); }
      }}
      onTouchStart={(event) => { swiped.current = false; gesture.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={(event) => {
        const start = gesture.current; gesture.current = null;
        if (!start) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; goTo(target.current + (dx > 0 ? 1 : -1)); }
      }}
      onClick={() => { if (swiped.current) { swiped.current = false; return; } if (ready) onOpen(current.current); }}
    >
      <div className="album-leaves album-leaves-3d" data-turning={turning}>
        <canvas ref={canvas} className="album-canvas" data-ready={ready} aria-hidden="true" />
        {children && <div className="album-rest">{children}</div>}
      </div>
    </div>
  );
});

export default FlatBook;
