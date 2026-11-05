/** Surface measurements in the 2022 × 778 book photograph's coordinate system.
 * Both the texture mesh and the clickable SVG regions use these same curves.
 * Keep the shell image and these measurements versioned together.
 */
export const BOOK_WIDTH = 2022;
export const BOOK_HEIGHT = 778;
export const BOOK_SHELL = "/images/catalog-book-blank.webp";
export const MESH_COLUMNS = 64;
export const MESH_ROWS = 16;
export type Point = { x: number; y: number };
export type PageSide = "left" | "right";
type Curve = readonly (readonly [number, number])[];

const EDGES: Record<PageSide, { top: Curve; bottom: Curve }> = {
  left: {
    top: [[216, 124], [267, 118], [317, 113], [368, 109], [419, 101], [469, 94], [520, 84], [571, 76], [622, 69], [672, 63], [723, 58], [774, 55], [824, 55], [875, 60], [926, 73], [976, 94], [1027, 130]],
    bottom: [[136, 619], [192, 615], [247, 614], [303, 609], [358, 604], [414, 598], [469, 592], [525, 585], [580, 577], [636, 571], [691, 566], [747, 563], [802, 563], [858, 566], [913, 574], [969, 591], [1024, 633]],
  },
  right: {
    top: [[1027, 130], [1077, 100], [1127, 84], [1177, 78], [1227, 74], [1277, 74], [1327, 77], [1377, 79], [1427, 83], [1476, 90], [1526, 95], [1576, 98], [1626, 104], [1676, 108], [1726, 112], [1776, 116], [1826, 126]],
    bottom: [[1024, 633], [1079, 603], [1134, 589], [1189, 583], [1244, 582], [1298, 583], [1353, 587], [1408, 593], [1463, 599], [1518, 605], [1573, 611], [1628, 616], [1683, 620], [1737, 622], [1792, 625], [1847, 626], [1902, 627]],
  },
};

function sampleCurve(points: Curve, t: number): Point {
  const scaled = Math.max(0, Math.min(1, t)) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  const catmull = (axis: 0 | 1) => .5 * (
    2 * p1[axis] + (-p0[axis] + p2[axis]) * f +
    (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * f * f +
    (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * f * f * f
  );
  return { x: catmull(0), y: catmull(1) };
}

/** Recover material spacing from the measured cross-section. Equal distances
 * on paper occupy less image width on a steep fold. Using both edges avoids
 * imposing a symmetric, arbitrary squeeze on this asymmetric photograph. */
function materialCoordinates(side: PageSide): number[] {
  const samples = 512;
  const distances = [0];
  let previous: Point | undefined;
  for (let i = 0; i <= samples; i++) {
    const top = sampleCurve(EDGES[side].top, i / samples);
    const bottom = sampleCurve(EDGES[side].bottom, i / samples);
    const point = { x: (top.x + bottom.x) / 2, y: (top.y + bottom.y) / 2 };
    if (previous) {
      // The camera compresses the elevation of the curved paper in this view.
      distances.push(distances[i - 1] + Math.hypot(point.x - previous.x, (point.y - previous.y) / .7));
    }
    previous = point;
  }
  const total = distances[samples];
  return distances.map((distance) => distance / total);
}

const MATERIAL_COORDINATES = { left: materialCoordinates("left"), right: materialCoordinates("right") };

export function paperCoordinate(side: PageSide, u: number): number {
  const value = Math.max(0, Math.min(1, u));
  const coordinates = MATERIAL_COORDINATES[side];
  let low = 0;
  let high = coordinates.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (coordinates[middle] < value) low = middle;
    else high = middle;
  }
  const fraction = (value - coordinates[low]) / (coordinates[high] - coordinates[low]);
  return (low + fraction) / (coordinates.length - 1);
}

export function pagePoint(side: PageSide, u: number, v: number): Point {
  const coordinate = paperCoordinate(side, u);
  const top = sampleCurve(EDGES[side].top, coordinate);
  const bottom = sampleCurve(EDGES[side].bottom, coordinate);
  return { x: top.x + (bottom.x - top.x) * v, y: top.y + (bottom.y - top.y) * v };
}

export function pageRegion(side: PageSide, u0 = 0, v0 = 0, u1 = 1, v1 = 1): string {
  const points: Point[] = [];
  for (let i = 0; i <= MESH_COLUMNS; i++) points.push(pagePoint(side, u0 + (u1 - u0) * i / MESH_COLUMNS, v0));
  for (let i = MESH_COLUMNS; i >= 0; i--) points.push(pagePoint(side, u0 + (u1 - u0) * i / MESH_COLUMNS, v1));
  return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
}

export type ProductBox = { u: number; v: number; width: number; height: number };
export function productBox(index: number): ProductBox {
  // Reading order is right to left, matching the accessible link order.
  return { u: index % 2 === 0 ? .54 : .09, v: .12 + Math.floor(index / 2) * .255, width: .36, height: .225 };
}

/** Project each source triangle onto the curved paper, with a subpixel overlap
 * so browser clip antialiasing cannot leave a white grid in the photograph. */
function triangle(ctx: CanvasRenderingContext2D, texture: HTMLCanvasElement, source: Point[], target: Point[], overlap = 2) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = target;
  const det = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
  if (Math.abs(det) < .001) return;
  const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / det;
  const c = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / det;
  const b = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / det;
  const d = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / det;
  const orientation = ((d1.x - d0.x) * (d2.y - d0.y) - (d1.y - d0.y) * (d2.x - d0.x)) >= 0 ? 1 : -1;
  ctx.save();
  ctx.beginPath();
  target.forEach((p, i) => {
    const previous = target[(i + 2) % 3];
    const next = target[(i + 1) % 3];
    const normal = (a: Point, b: Point) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: (b.y - a.y) / length * orientation, y: -(b.x - a.x) / length * orientation };
    };
    const n0 = normal(previous, p);
    const n1 = normal(p, next);
    const amount = overlap / Math.max(.001, 1 + n0.x * n1.x + n0.y * n1.y);
    const x = p.x + (n0.x + n1.x) * amount;
    const y = p.y + (n0.y + n1.y) * amount;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, d0.x - a * s0.x - c * s0.y, d0.y - b * s0.x - d * s0.y);
  ctx.drawImage(texture, 0, 0);
  ctx.restore();
}

export function drawPage(ctx: CanvasRenderingContext2D, texture: HTMLCanvasElement, side: PageSide, openness = 1, lift = 0) {
  const project = (u: number, v: number) => {
    const p = pagePoint(side, u, v);
    const spine = pagePoint(side, side === "left" ? 1 : 0, v);
    const distance = side === "left" ? 1 - u : u;
    return { x: spine.x + (p.x - spine.x) * openness, y: p.y - lift * distance * (1 + .2 * Math.sin(v * Math.PI)) };
  };
  const columns = MESH_COLUMNS;
  const rows = MESH_ROWS;
  ctx.save();
  // Clip the expanded triangles back to the exact silhouette.
  ctx.beginPath();
  for (let i = 0; i <= columns; i++) {
    const p = project(i / columns, 0);
    if (!i) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  for (let i = columns; i >= 0; i--) {
    const p = project(i / columns, 1);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.clip();
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      const uv = [[x / columns, y / rows], [(x + 1) / columns, y / rows], [(x + 1) / columns, (y + 1) / rows], [x / columns, (y + 1) / rows]];
      const source = uv.map(([u, v]) => ({ x: u * texture.width, y: v * texture.height }));
      const target = uv.map(([u, v]) => project(u, v));
      triangle(ctx, texture, [source[0], source[1], source[2]], [target[0], target[1], target[2]]);
      triangle(ctx, texture, [source[0], source[2], source[3]], [target[0], target[2], target[3]]);
    }
  }
  // A lifted sheet catches less of the overhead light as it turns edge-on.
  if (openness < 1) {
    ctx.fillStyle = `rgba(24,21,17,${(1 - openness) * .12})`;
    ctx.fillRect(0, 0, BOOK_WIDTH, BOOK_HEIGHT);
  }
  ctx.restore();
}

/** A cylindrical fold travels from the free edge toward the binding. The flat
 * portion stays on its photographed surface while the paper rolls over itself;
 * material length is preserved instead of shrinking the entire printed page. */
function foldAt(progress: number, v: number) {
  const wave = Math.sin(Math.PI * progress);
  return { position: 1 - progress + .14 * wave * (.5 - v), radius: .075 * wave };
}

function foldedMaterial(progress: number, distance: number, v: number) {
  const { position, radius } = foldAt(progress, v);
  if (distance <= position) return { coordinate: distance, height: 0, angle: 0 };
  if (radius < .000001) return { coordinate: -distance, height: 0, angle: Math.PI };
  const arc = Math.min(Math.PI, (distance - position) / radius);
  const tail = Math.max(0, distance - position - Math.PI * radius);
  return {
    coordinate: position + radius * Math.sin(arc) - tail,
    height: radius * (1 - Math.cos(arc)),
    angle: arc,
  };
}

function restingMaterial(direction: -1 | 1, coordinate: number, v: number) {
  const side: PageSide = (direction === 1) === (coordinate >= 0) ? "left" : "right";
  const distance = Math.min(1, Math.abs(coordinate));
  return pagePoint(side, side === "left" ? 1 - distance : distance, v);
}

export function turningPagePoint(direction: -1 | 1, progress: number, distance: number, v: number): Point {
  const p = Math.max(0, Math.min(1, progress));
  if (distance === 0) return pagePoint("right", 0, v);
  if (p === 0) return restingMaterial(direction, distance, v);
  if (p === 1) return restingMaterial(direction, -distance, v);
  const material = foldedMaterial(p, distance, v);
  const point = restingMaterial(direction, material.coordinate, v);
  const outer = restingMaterial(direction, 1, v);
  const spine = pagePoint("right", 0, v);
  const width = Math.abs(outer.x - spine.x);
  // Raised paper no longer inherits the resting book's dip at the binding.
  // Let it unfold toward a plane while airborne, then settle into the measured
  // surface as its elevation returns to zero.
  const projectedOuter = restingMaterial(direction, material.coordinate >= 0 ? 1 : -1, v);
  const planeY = spine.y + (projectedOuter.y - spine.y) * Math.abs(material.coordinate);
  const airborne = Math.min(1, material.height / .025);
  const surfaceY = point.y * (1 - airborne) + planeY * airborne;
  return { x: point.x, y: surfaceY - material.height * width * (.16 + .24 * v) };
}

const turnLightingCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function turningTexture(texture: HTMLCanvasElement, side: PageSide, progress: number) {
  let shaded = turnLightingCache.get(texture);
  if (!shaded) {
    shaded = document.createElement("canvas");
    shaded.width = texture.width;
    shaded.height = texture.height;
    turnLightingCache.set(texture, shaded);
  }
  const ctx = shaded.getContext("2d")!;
  ctx.clearRect(0, 0, shaded.width, shaded.height);
  ctx.drawImage(texture, 0, 0);
  // Shade in material space before projection. Shading individual mesh cells
  // leaves visible antialiasing seams on pale paper during the fold.
  for (let row = 0; row < 32; row++) {
    const gradient = ctx.createLinearGradient(0, 0, shaded.width, 0);
    for (let x = 0; x <= 128; x++) {
      const u = x / 128;
      const material = foldedMaterial(progress, side === "left" ? 1 - u : u, (row + .5) / 32);
      gradient.addColorStop(u, `rgba(35,29,23,${Math.sin(material.angle) ** 2 * .2})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, row * shaded.height / 32, shaded.width, shaded.height / 32 + 1);
  }
  return shaded;
}

export function drawTurningPage(ctx: CanvasRenderingContext2D, front: HTMLCanvasElement, back: HTMLCanvasElement, direction: -1 | 1, progress: number) {
  const columns = 64;
  const rows = 12;
  const project = (d: number, v: number) => turningPagePoint(direction, progress, d, v);
  const shadedFront = turningTexture(front, direction === 1 ? "left" : "right", progress);
  const shadedBack = turningTexture(back, direction === 1 ? "right" : "left", progress);
  // The contact shadow follows the roll, staying close to the underlying paper.
  ctx.save();
  ctx.clip(new Path2D(pageRegion("left") + " " + pageRegion("right")));
  ctx.filter = "blur(9px)";
  ctx.strokeStyle = `rgba(26,23,19,${.24 * Math.sin(progress * Math.PI)})`;
  ctx.lineWidth = 24;
  ctx.beginPath();
  for (let y = 0; y <= rows; y++) {
    const v = y / rows;
    const { position, radius } = foldAt(progress, v);
    const point = restingMaterial(direction, Math.min(1, position + radius), v);
    if (!y) ctx.moveTo(point.x, point.y + 5); else ctx.lineTo(point.x, point.y + 5);
  }
  ctx.stroke();
  ctx.restore();

  const vertices = Array.from({ length: columns + 1 }, (_, x) =>
    Array.from({ length: rows + 1 }, (_, y) => project(x / columns, y / rows)));
  const cells = Array.from({ length: columns * rows }, (_, i) => {
    const x = Math.floor(i / rows);
    const y = i % rows;
    const material = foldedMaterial(progress, (x + .5) / columns, (y + .5) / rows);
    return { x, y, material };
  });
  // A folded tail can cover the still-flat face; sort by actual sheet elevation.
  cells.sort((a, b) => a.material.height - b.material.height || a.x - b.x);
  // Clip to the union of the mesh cells. A folded outline overlaps itself, so
  // one outline polygon would incorrectly cut holes in the visible reverse.
  const silhouette = new Path2D();
  for (const { x, y } of cells) {
    const points = [vertices[x][y], vertices[x + 1][y], vertices[x + 1][y + 1], vertices[x][y + 1]];
    const area = points.reduce((sum, point, i) => sum + point.x * points[(i + 1) % 4].y - point.y * points[(i + 1) % 4].x, 0);
    if (area < 0) points.reverse();
    points.forEach((point, i) => { if (!i) silhouette.moveTo(point.x, point.y); else silhouette.lineTo(point.x, point.y); });
    silhouette.closePath();
  }
  ctx.save();
  ctx.clip(silhouette);
  for (const { x, y, material } of cells) {
    const frontFacing = Math.cos(material.angle) >= 0;
    const texture = frontFacing ? shadedFront : shadedBack;
    const side: PageSide = (direction === 1) === frontFacing ? "left" : "right";
    const uv = [[x / columns, y / rows], [(x + 1) / columns, y / rows], [(x + 1) / columns, (y + 1) / rows], [x / columns, (y + 1) / rows]];
    const source = uv.map(([d, v]) => ({ x: (side === "left" ? 1 - d : d) * texture.width, y: v * texture.height }));
    const target = [vertices[x][y], vertices[x + 1][y], vertices[x + 1][y + 1], vertices[x][y + 1]];
    triangle(ctx, texture, [source[0], source[1], source[2]], [target[0], target[1], target[2]], .8);
    triangle(ctx, texture, [source[0], source[2], source[3]], [target[0], target[2], target[3]], .8);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = `rgba(251,246,233,${.45 * Math.sin(progress * Math.PI)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 0; y <= rows; y++) {
    const point = vertices[columns][y];
    if (!y) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke(); ctx.restore();
}
