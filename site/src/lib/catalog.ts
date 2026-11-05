/**
 * The flip catalogue: the client's 28-page catalogue (stripline-flip-show), one image per page in
 * /public/catalog. Hotspots are drawn in a 654 × 925 grid (the page image at half size) and link
 * either to a product page (`slug`) or to another catalogue page (`page`).
 */

export type CatalogHotspot = { x: number; y: number; w: number; h: number; slug?: string; page?: number; label?: string };
export type CatalogPage = { n: number; title: string; src: string; thumb: string; hotspots: CatalogHotspot[] };
export type CatalogTopic = { title: string; items: { title: string; page: number }[] };

export const CATALOG_GRID = { w: 654, h: 925 };

const TITLES = [
  "כריכה", "כמה מילים מאיתנו", "פתרונות אדריכליים לאוויר", "תוכן עניינים", "דקור", "דקור", "סלוט SL", "סלוט צר", "סלוט צוקל",
  "תקרתי ואריחים", "דיפיוזרים", "מפזרי חריץ ליניאריים", "מפזרי סחרור", "עגולים", "אוויר חוזר", "תריסי אספקה", "גרילים",
  "גרילים דקורטיביים", "גרילים חיצוניים", "גריל להעברת אוויר", "גריל אוורור לתעלות עגולות", "דלתות שירות", "מרכזיות למזגן",
  "מדפי ויסות ובקרה", "תעלות גמישות", "אביזרים", "יצירת קשר", "כריכה אחורית",
];

/** A row of equal product tiles: column edges (x0, x1) and the row's top and bottom. */
const tiles = (cols: [number, number][], y0: number, y1: number, slugs: (string | null)[]): CatalogHotspot[] =>
  slugs.flatMap((slug, i) => (slug ? [{ x: cols[i][0], y: y0, w: cols[i][1] - cols[i][0], h: y1 - y0, slug }] : []));

// Tile columns as laid out in the catalogue, left to right.
const FIVE: [number, number][] = [[35, 145], [153, 263], [271, 382], [390, 501], [509, 620]];
const FIVE_TALL: [number, number][] = [[33, 142], [152, 262], [272, 382], [391, 501], [511, 620]];
const THREE: [number, number][] = [[35, 224], [233, 422], [432, 620]];
const card = (y0: number, y1: number, slug: string, x0 = 55, x1 = 600): CatalogHotspot => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, slug });

// The table-of-contents page: every row jumps to its page.
const TOC_ROWS: [number, number][] = [
  [2, 183], [3, 222], [5, 263], [7, 302], [8, 343], [9, 383], [10, 424], [11, 464], [12, 504],
  [13, 545], [14, 585], [15, 625], [16, 666], [17, 706], [18, 746], [19, 786], [20, 827],
];

const HOTSPOTS: Record<number, CatalogHotspot[]> = {
  4: TOC_ROWS.map(([page, y]) => ({ x: 55, y: y - 19, w: 545, h: 38, page, label: TITLES[page - 1] })),
  11: [
    ...tiles(FIVE, 450, 541, ["pc", "pff-pfdd", "pfd-pf", "pgp", "rcd-rcd-r-rcdh-rcd-rh"]),
    ...tiles(FIVE, 549, 640, ["sl", "cd-ck", "ac", "lcd", "pa"]),
    ...tiles(FIVE, 649, 740, [null, "cd-dd", "cd-s", "cd", "fd"]),
  ],
  12: tiles(THREE, 447, 658, ["sp2-sp3", "bd1-bd2-bdv", "slot"]),
  13: [
    ...tiles(THREE, 447, 598, ["ss", "std-std-1", "swr"]),
    ...tiles([[35, 322], [331, 620]], 607, 760, ["vsr", "vs"]),
  ],
  14: [
    card(335, 540, "jd", 33, 322),
    card(335, 540, "rcd-rcd-r-rcdh-rcd-rh", 331, 620),
    card(550, 722, "rcd-rcd-r-rcdh-rcd-rh", 331, 620),
    card(735, 862, "vsr", 331, 620),
  ],
  15: [card(648, 815, "fil", 50, 322)],
  17: [
    card(333, 488, "egg-eggd", 55, 322), card(333, 488, "dd-dd1", 331, 600),
    card(497, 690, "sd-sdd", 55, 322), card(497, 690, "eilat", 331, 600),
    card(700, 805, "sd-dd"),
  ],
  18: [card(340, 488, "d-ss1-d-ss2"), card(512, 660, "lbd-lbdb-lbdd"), card(683, 830, "lbd-lbdb-lbdd")],
  19: [card(337, 500, "wpl-wpls"), card(521, 660, "wplh"), card(683, 820, "wplsr-wplr")],
  20: [card(337, 498, "nrd-nrdd"), card(512, 660, "lbdf"), card(674, 822, "tg-tgs")],
  21: [card(337, 575, "rdd-rdd-1"), card(597, 790, "rdr-rdr1")],
  22: [card(337, 548, "ad", 331, 603), card(337, 495, "ag", 52, 320), card(507, 742, "vcd", 52, 320)],
  24: tiles(FIVE_TALL, 490, 850, ["iris", "rd", "rsd", "obd", "vcd"]),
  25: [card(457, 850, "tub", 33, 620)],
  26: [
    ...tiles(THREE, 470, 655, ["fil", "special-parts", "adp"]),
    ...tiles(THREE, 665, 852, ["mounting-clips", "cc", "mounting-spring"]),
  ],
};

export const CATALOG_PAGES: CatalogPage[] = TITLES.map((title, i) => {
  const n = i + 1;
  const file = `/catalog/p${String(n).padStart(2, "0")}`;
  return { n, title, src: `${file}.webp`, thumb: `${file}-s.webp`, hotspots: HOTSPOTS[n] ?? [] };
});

/** The table of contents, grouped by subject (the client's ordering). */
export const CATALOG_TOPICS: CatalogTopic[] = [
  { title: "פתיחה", items: [[1, "כריכה"], [2, "כמה מילים מאיתנו"], [3, "פתרונות אדריכליים לאוויר"], [4, "תוכן עניינים"]] },
  { title: "דקור וסלוטים", items: [[5, "דקור"], [7, "סלוט SL"], [8, "סלוט צר"], [9, "סלוט צוקל"]] },
  { title: "מפזרים", items: [[10, "תקרתי ואריחים"], [11, "דיפיוזרים"], [12, "מפזרי חריץ ליניאריים"], [13, "מפזרי סחרור"], [14, "עגולים"]] },
  {
    title: "תריסים וגרילים",
    items: [[15, "אוויר חוזר"], [16, "תריסי אספקה"], [17, "גרילים"], [18, "גרילים דקורטיביים"], [19, "גרילים חיצוניים"], [20, "גריל להעברת אוויר"], [21, "גריל אוורור לתעלות עגולות"]],
  },
  { title: "שירות, ויסות ואביזרים", items: [[22, "דלתות שירות"], [23, "מרכזיות למזגן"], [24, "מדפי ויסות ובקרה"], [25, "תעלות גמישות"], [26, "אביזרים"]] },
  { title: "סיום", items: [[27, "יצירת קשר"], [28, "כריכה אחורית"]] },
].map((t) => ({ title: t.title, items: (t.items as [number, string][]).map(([page, title]) => ({ page, title })) }));

/** The catalogue page that shows a product, for "view in catalogue" links. */
export function catalogPageFor(slug: string): number | undefined {
  return CATALOG_PAGES.find((p) => p.hotspots.some((h) => h.slug === slug))?.n;
}
