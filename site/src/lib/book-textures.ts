import { productBox } from "./book-surface";
import { optimizedImage } from "./image-url";
import { applyBookLighting, PAPER_WIDTH, PAPER_HEIGHT, type BookLighting } from "./book-lighting";
import type { AlbumSpread } from "./album";

export type BookProduct = { slug: string; code: string; name: string; image: string };
export type BookSpread = { title: string; description: string; image: string; family: string; products: BookProduct[] };
export type SpreadTextures = { left: HTMLCanvasElement; right: HTMLCanvasElement };

/** Loads a resized copy when `width` is given, falling back to the original file. */
export async function loadBookImage(url: string, width?: number): Promise<HTMLImageElement | null> {
  const resized = width ? optimizedImage(url, width) : url;
  return (await loadImage(resized)) ?? (resized !== url ? loadImage(url) : null);
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const timeout = window.setTimeout(() => resolve(null), 12000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); resolve(null); };
    image.src = url;
  });
}

function paper() {
  const canvas = document.createElement("canvas");
  canvas.width = PAPER_WIDTH;
  canvas.height = PAPER_HEIGHT;
  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, maxLines = 3) {
  const words = text.split(/\s+/);
  let line = "";
  let row = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > width && line) {
      ctx.fillText(row === maxLines - 1 ? `${line}…` : line, x, y + row * lineHeight, width);
      if (++row >= maxLines) return;
      line = words[i];
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y + row * lineHeight, width);
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) * .66, (height - h) / 2, w, h);
}

/** Text is typeset with the loaded site font before the entire printed page is
 * projected onto the paper. Nothing is positioned as a flat label above it. */
export async function createSpreadTextures(spread: BookSpread, index: number, total: number, font: string, lighting?: BookLighting, imageLoader = loadBookImage): Promise<SpreadTextures> {
  const [scene, ...products] = await Promise.all([imageLoader(spread.image, 1200), ...spread.products.map((p) => imageLoader(p.image, 256))]);
  const left = paper();
  const right = paper();
  const lc = left.getContext("2d")!;
  const rc = right.getContext("2d")!;
  lc.fillStyle = "#494638";
  lc.fillRect(0, 0, left.width, left.height);
  if (scene) drawCover(lc, scene, left.width, left.height);
  const wash = lc.createLinearGradient(0, 0, 0, left.height);
  wash.addColorStop(0, "rgba(18,17,13,.46)");
  wash.addColorStop(.44, "rgba(18,17,13,0)");
  wash.addColorStop(1, "rgba(18,17,13,.16)");
  lc.fillStyle = wash;
  lc.fillRect(0, 0, left.width, left.height);
  lc.fillStyle = "#fffdf7";
  lc.direction = "rtl";
  lc.textAlign = "right";
  lc.font = `500 48px ${font}`;
  wrapText(lc, spread.title, 960, 106, 820, 58, 2);
  lc.font = `300 25px ${font}`;
  wrapText(lc, spread.description, 960, 195, 730, 36, 3);
  lc.direction = "ltr";
  lc.textAlign = "left";
  lc.font = `400 20px ${font}`;
  lc.fillText(`${String(index * 2 + 2).padStart(2, "0")} / ${total * 2}`, 78, 698);
  if (lighting) applyBookLighting(lc, "left", lighting);

  rc.fillStyle = "#ffffff";
  rc.fillRect(0, 0, right.width, right.height);
  rc.fillStyle = "#777065";
  rc.direction = "rtl";
  rc.textAlign = "right";
  rc.font = `400 19px ${font}`;
  rc.fillText(spread.title, 990, 58);
  spread.products.forEach((product, i) => {
    const box = productBox(i);
    const x = box.u * right.width;
    const y = box.v * right.height;
    const width = box.width * right.width;
    const height = box.height * right.height;
    const image = products[i];
    if (image) {
      const scale = Math.min((width - 32) / image.width, (height - 52) / image.height);
      rc.save();
      rc.globalCompositeOperation = "multiply";
      rc.drawImage(image, x + (width - image.width * scale) / 2, y, image.width * scale, image.height * scale);
      rc.restore();
    }
    rc.fillStyle = "#292822";
    rc.direction = "ltr";
    rc.textAlign = "center";
    rc.font = `500 21px ${font}`;
    rc.fillText(product.code || product.name, x + width / 2, y + height - 22, width);
    rc.direction = "rtl";
    rc.font = `400 17px ${font}`;
    rc.fillStyle = "#635e55";
    rc.fillText(product.name, x + width / 2, y + height, width);
  });
  rc.direction = "ltr";
  rc.textAlign = "left";
  rc.font = `400 21px ${font}`;
  rc.fillStyle = "#3c3932";
  rc.fillText("S T R I P L I N E", 90, 704);
  rc.textAlign = "right";
  rc.font = `400 18px ${font}`;
  rc.fillText(`${String(index * 2 + 1).padStart(2, "0")} / ${total * 2}`, 990, 704);
  if (lighting) applyBookLighting(rc, "right", lighting);
  return { left, right };
}


function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      if (lines.length === maxLines - 1) { lines.push(`${line}…`); return lines; }
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** The album spread: the product page on the left sheet, its atmosphere photo on the right. */
export async function createAlbumTextures(spread: AlbumSpread, index: number, total: number, font: string, lighting?: BookLighting, imageLoader = loadBookImage): Promise<SpreadTextures> {
  const [scene, product] = await Promise.all([imageLoader(spread.scene, 1200), imageLoader(spread.image, 640)]);
  const left = paper();
  const right = paper();
  const lc = left.getContext("2d")!;
  const rc = right.getContext("2d")!;
  // Read right to left: the current spread first, then the total.
  const number = `${String(total).padStart(2, "0")} / ${String(index + 1).padStart(2, "0")}`;

  // Atmosphere photo
  rc.fillStyle = "#494638";
  rc.fillRect(0, 0, right.width, right.height);
  if (scene) drawCover(rc, scene, right.width, right.height);
  const wash = rc.createLinearGradient(0, 0, 0, right.height);
  wash.addColorStop(0, "rgba(18,17,13,0)");
  wash.addColorStop(.55, "rgba(18,17,13,0)");
  wash.addColorStop(1, "rgba(18,17,13,.78)");
  rc.fillStyle = wash;
  rc.fillRect(0, 0, right.width, right.height);
  rc.direction = "rtl";
  rc.textAlign = "right";
  rc.fillStyle = "#e3bb80";
  rc.font = `400 27px ${font}`;
  rc.fillText(spread.familyName, 1020, 618);
  rc.fillStyle = "#fffdf7";
  rc.font = `500 54px ${font}`;
  wrapLines(rc, spread.name, 860, 1).forEach((line) => rc.fillText(line, 1020, 684, 900));
  if (lighting) applyBookLighting(rc, "right", lighting);

  // Product page
  lc.fillStyle = "#ffffff";
  lc.fillRect(0, 0, left.width, left.height);
  lc.direction = "rtl";
  lc.textAlign = "right";
  lc.fillStyle = "#8d8478";
  lc.font = `400 22px ${font}`;
  lc.fillText(spread.familyName, 1010, 76);
  lc.direction = "ltr";
  lc.textAlign = "left";
  lc.fillText(number, 90, 76);
  lc.fillStyle = "#d9c9aa";
  lc.fillRect(90, 98, 920, 2);

  const box = { x: 90, y: 140, width: 380, height: 470 };
  const tint = lc.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
  tint.addColorStop(0, "#f7f5f1");
  tint.addColorStop(1, "#ece8e1");
  lc.fillStyle = tint;
  lc.beginPath();
  lc.roundRect(box.x, box.y, box.width, box.height, 12);
  lc.fill();
  if (product) {
    const scale = Math.min((box.width - 60) / product.width, (box.height - 60) / product.height);
    lc.save();
    lc.globalCompositeOperation = "multiply";
    lc.drawImage(product, box.x + (box.width - product.width * scale) / 2, box.y + (box.height - product.height * scale) / 2, product.width * scale, product.height * scale);
    lc.restore();
  }

  const edge = 1010;
  const column = 480;
  let y = 196;
  lc.direction = "rtl";
  lc.textAlign = "right";
  lc.fillStyle = "#1b1917";
  lc.font = `500 50px ${font}`;
  for (const line of wrapLines(lc, spread.name, column, 2)) { lc.fillText(line, edge, y, column); y += 58; }
  lc.direction = "ltr";
  lc.fillStyle = "#a77940";
  lc.font = `400 24px ${font}`;
  lc.fillText(spread.code, edge, y - 12, column);
  y += 44;
  lc.direction = "rtl";
  lc.fillStyle = "#5d564d";
  lc.font = `400 25px ${font}`;
  for (const line of wrapLines(lc, spread.description, column, 4)) { lc.fillText(line, edge, y, column); y += 38; }
  y += 18;
  lc.fillStyle = "#ae8b4d";
  lc.font = `500 22px ${font}`;
  lc.fillText("מידות", edge, y);
  lc.fillStyle = "#c1a36d";
  lc.fillRect(edge - column, y + 10, column, 1.5);
  y += 46;
  lc.fillStyle = "#322d26";
  lc.font = `400 23px ${font}`;
  for (const line of wrapLines(lc, spread.sizes.slice(0, 2).join(" · "), column, 2)) { lc.fillText(line, edge, y, column); y += 34; }

  lc.fillStyle = "#e4dfd6";
  lc.fillRect(90, 650, 920, 2);
  lc.fillStyle = "#8d8478";
  lc.font = `400 20px ${font}`;
  lc.fillText("לחצו להגדלה", edge, 696);
  lc.direction = "ltr";
  lc.textAlign = "left";
  lc.fillText("S T R I P L I N E", 90, 696);
  if (lighting) applyBookLighting(lc, "left", lighting);
  return { left, right };
}

/** A page canvas printed at `scale` device pixels per unit; drawing coordinates stay
 * PAPER_WIDTH x PAPER_HEIGHT. Printing at the displayed size keeps the type sharp. */
function flatPaper(scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAPER_WIDTH * scale);
  canvas.height = Math.round(PAPER_HEIGHT * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(canvas.width / PAPER_WIDTH, canvas.height / PAPER_HEIGHT);
  return { canvas, ctx };
}

function gutterShade(ctx: CanvasRenderingContext2D, side: "left" | "right") {
  const spine = side === "left" ? PAPER_WIDTH : 0;
  const shade = ctx.createLinearGradient(spine, 0, spine + (side === "left" ? -130 : 130), 0);
  shade.addColorStop(0, "rgba(20,17,13,.3)");
  shade.addColorStop(.35, "rgba(20,17,13,.09)");
  shade.addColorStop(1, "rgba(20,17,13,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);
}

/** The top-down album spread, typeset like the printed reference: the product page on the
 * left sheet and its atmosphere photo on the right. */
export async function createFlatAlbumTextures(spread: AlbumSpread, index: number, total: number, font: string, scale = 1.5, imageLoader = loadBookImage, photoScale = scale): Promise<SpreadTextures> {
  const [scene, product] = await Promise.all([imageLoader(spread.scene, photoScale > 1.8 ? 3840 : 1920), imageLoader(spread.image, photoScale > 1.8 ? 1080 : 640)]);
  const { canvas: left, ctx: lc } = flatPaper(scale);
  const { canvas: right, ctx: rc } = flatPaper(scale);
  // Read right to left: the current spread first, then the total.
  const number = `${String(total).padStart(2, "0")} / ${String(index + 1).padStart(2, "0")}`;
  const spaced = (text: string) => text.toUpperCase().split("").join("  ");

  // Atmosphere photo
  rc.fillStyle = "#494638";
  rc.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);
  if (scene) drawCover(rc, scene, PAPER_WIDTH, PAPER_HEIGHT);
  const wash = rc.createLinearGradient(0, 0, 0, PAPER_HEIGHT);
  wash.addColorStop(0, "rgba(18,17,13,0)");
  wash.addColorStop(.52, "rgba(18,17,13,0)");
  wash.addColorStop(1, "rgba(18,17,13,.8)");
  rc.fillStyle = wash;
  rc.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);
  rc.direction = "rtl";
  rc.textAlign = "right";
  rc.fillStyle = "#e3bb80";
  rc.font = `400 28px ${font}`;
  rc.fillText(spread.familyName, 1030, 612);
  rc.fillStyle = "#fffdf7";
  rc.font = `700 60px ${font}`;
  wrapLines(rc, spread.name, 880, 1).forEach((line) => rc.fillText(line, 1030, 684, 920));
  gutterShade(rc, "right");

  // Product page
  const edge = 1012;
  const margin = 88;
  lc.fillStyle = "#f5f2ec";
  lc.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);
  lc.fillStyle = "#4a453f";
  lc.font = `400 21px ${font}`;
  lc.direction = "ltr";
  lc.textAlign = "right";
  lc.fillText(spaced("STRIPLINE"), edge, 82);
  lc.textAlign = "left";
  lc.fillText(number, margin, 82);
  lc.fillStyle = "#cdb17e";
  lc.fillRect(margin, 106, edge - margin, 1.5);

  const box = { x: margin, y: 140, width: 390, height: 470 };
  lc.fillStyle = "#e6e0d6";
  lc.beginPath();
  lc.roundRect(box.x, box.y, box.width, box.height, 18);
  lc.fill();
  if (product) {
    const scale = Math.min((box.width - 70) / product.width, (box.height - 70) / product.height);
    lc.save();
    lc.globalCompositeOperation = "multiply";
    lc.drawImage(product, box.x + (box.width - product.width * scale) / 2, box.y + (box.height - product.height * scale) / 2, product.width * scale, product.height * scale);
    lc.restore();
  }

  const column = 470;
  lc.direction = "rtl";
  lc.textAlign = "right";
  lc.font = `700 54px ${font}`;
  const nameLines = wrapLines(lc, spread.name, column, 2);
  lc.font = `400 26px ${font}`;
  const descLines = wrapLines(lc, spread.description, column, 3);
  const detail = spread.materials.slice(0, 2).join(" · ") || spread.sizes[0] || "";
  const detailLines = detail ? wrapLines(lc, detail, column, 1) : [];
  const height = nameLines.length * 64 + 30 + descLines.length * 42 + (detailLines.length ? 70 : 0);
  let y = box.y + (box.height - height) / 2 + 46;
  lc.fillStyle = "#1b1917";
  lc.font = `700 54px ${font}`;
  for (const line of nameLines) { lc.fillText(line, edge, y, column); y += 64; }
  lc.fillStyle = "#b8894a";
  lc.fillRect(edge - 58, y - 34, 58, 3);
  y += 30;
  lc.fillStyle = "#4a453f";
  lc.font = `400 26px ${font}`;
  for (const line of descLines) { lc.fillText(line, edge, y, column); y += 42; }
  if (detailLines.length) {
    lc.fillStyle = "#cdb17e";
    lc.fillRect(edge - column, y - 12, column, 1.5);
    lc.fillStyle = "#4a453f";
    lc.fillText(detailLines[0], edge, y + 36, column);
  }

  lc.fillStyle = "#bdb6aa";
  lc.fillRect(margin, 644, edge - margin, 1.5);
  lc.fillStyle = "#4a453f";
  lc.font = `400 19px ${font}`;
  lc.direction = "ltr";
  lc.textAlign = "right";
  lc.fillText(spaced(spread.familyNameEn), edge, 690);
  lc.textAlign = "left";
  lc.fillText(spaced("STRIPLINE"), margin, 690);
  gutterShade(lc, "left");
  return { left, right };
}
