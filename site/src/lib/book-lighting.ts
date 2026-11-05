import { BOOK_WIDTH, BOOK_HEIGHT, pagePoint, type PageSide } from "./book-surface";

export const PAPER_WIDTH = 1100;
export const PAPER_HEIGHT = 760;
type PaperLight = { multiply: HTMLCanvasElement; highlight: HTMLCanvasElement };
export type BookLighting = Record<PageSide, PaperLight>;

/** Unwrap the blank photographed paper into the same UV space as the content.
 * Sampling the actual paper preserves the asymmetric gutter, reflected light,
 * and fine grain. The maps are built once and reused for every catalog spread.
 */
export function createBookLighting(shell: HTMLImageElement): BookLighting {
  const source = document.createElement("canvas");
  source.width = BOOK_WIDTH;
  source.height = BOOK_HEIGHT;
  const ctx = source.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(shell, 0, 0, BOOK_WIDTH, BOOK_HEIGHT);
  const pixels = ctx.getImageData(0, 0, BOOK_WIDTH, BOOK_HEIGHT).data;

  function makeMap(side: PageSide): PaperLight {
    const multiply = document.createElement("canvas");
    multiply.width = PAPER_WIDTH;
    multiply.height = PAPER_HEIGHT;
    const highlight = document.createElement("canvas");
    highlight.width = PAPER_WIDTH;
    highlight.height = PAPER_HEIGHT;
    const mc = multiply.getContext("2d")!;
    const hc = highlight.getContext("2d")!;
    const light = mc.createImageData(PAPER_WIDTH, PAPER_HEIGHT);
    const sheen = hc.createImageData(PAPER_WIDTH, PAPER_HEIGHT);

    for (let x = 0; x < PAPER_WIDTH; x++) {
      const u = x / (PAPER_WIDTH - 1);
      // Leave a tiny sampling inset to exclude the background and page stack.
      const top = pagePoint(side, u, .003);
      const bottom = pagePoint(side, u, .997);
      for (let y = 0; y < PAPER_HEIGHT; y++) {
        const v = y / (PAPER_HEIGHT - 1);
        const sx = top.x + (bottom.x - top.x) * v;
        const sy = top.y + (bottom.y - top.y) * v;
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const fx = sx - x0;
        const fy = sy - y0;
        const target = (y * PAPER_WIDTH + x) * 4;
        let luminance = 0;
        for (let channel = 0; channel < 3; channel++) {
          const a = pixels[(y0 * BOOK_WIDTH + x0) * 4 + channel];
          const b = pixels[(y0 * BOOK_WIDTH + x0 + 1) * 4 + channel];
          const c = pixels[((y0 + 1) * BOOK_WIDTH + x0) * 4 + channel];
          const d = pixels[((y0 + 1) * BOOK_WIDTH + x0 + 1) * 4 + channel];
          const value = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
          light.data[target + channel] = value;
          luminance += value / 3;
          sheen.data[target + channel] = 255;
        }
        light.data[target + 3] = 255;
        // A restrained reflected highlight sits above the ink, like matte stock.
        sheen.data[target + 3] = Math.max(0, Math.min(7, (luminance - 235) * .35));
      }
    }
    mc.putImageData(light, 0, 0);
    hc.putImageData(sheen, 0, 0);
    return { multiply, highlight };
  }
  return { left: makeMap("left"), right: makeMap("right") };
}

export function applyBookLighting(ctx: CanvasRenderingContext2D, side: PageSide, lighting: BookLighting) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(lighting[side].multiply, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(lighting[side].highlight, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}
