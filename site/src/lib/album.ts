import type { Family, Product, Settings } from "./types";
import { productImage } from "./design";
import { iconKey, isUsageLine, productFeatureItems, productFeatures, productHasDrawing, productHasInstallation, productSizes, productUsage } from "./product-text";
import { srcSetFor, type MediaSizes } from "./media-sizes";
import bookHidden from "@/data/book-hidden.json";

/** Products left out of the flip book only (data/book-hidden.json); they stay on the rest of the site. */
const HIDDEN = new Set<string>(bookHidden.slugs);

/** Left out of the flip book: such a product has no page in the book to link to. */
export function isHiddenFromBook(slug: string): boolean {
  return HIDDEN.has(slug);
}

/** One open spread of the flip book: an atmosphere photo facing the product's page. */
export type AlbumSpread = {
  slug: string;
  code: string;
  name: string;
  familyName: string;
  familyNameEn: string;
  image: string;
  scene: string;
  /** Resized copies from WordPress for the browser to choose from (undefined: only the original). */
  imageSrcSet?: string;
  sceneSrcSet?: string;
  description: string;
  features: string[];
  sizes: string[];
  materials: string[];
  usage: string;
  /** For the book in the popup's design (WordPress > קטלוג > "ספר מדפדף בעיצוב החלון הקופץ"). */
  subtitle: string;
  hasSizes: boolean;
  highlights: { icon?: string; text: string }[];
  hasDrawing: boolean;
  hasInstall: boolean;
};

export function buildAlbumSpreads(settings: Settings, families: Family[], products: Product[], media?: MediaSizes): AlbumSpread[] {
  return families.flatMap((family) =>
    products.filter((p) => p.family === family.slug && !HIDDEN.has(p.slug)).map((p) => withSrcSets({
      slug: p.slug,
      code: p.code,
      name: p.name_he,
      familyName: family.name_he,
      familyNameEn: family.name,
      image: productImage(p),
      scene: p.hero_image || family.image || settings.book_image || settings.hero_image,
      description: p.description_he || p.short_he,
      features: productFeatures(p),
      sizes: productSizes(p),
      materials: p.materials_he,
      usage: productUsage(p),
      subtitle: p.subtitle_he || "",
      hasSizes: productSizes(p).length > 0 || p.lengths.length > 0 || p.heights.length > 0,
      highlights: bookHighlights(p),
      hasDrawing: productHasDrawing(p),
      hasInstall: productHasInstallation(p),
    }, media)),
  );
}

/** The highlights shown over the photo, without lines that repeat the description or the usage (as in the popup). */
export function bookHighlights(p: Product): { icon?: string; text: string }[] {
  const lead = (p.description_he || p.short_he || "").trim();
  return productFeatureItems(p).filter(({ text }) => text !== lead && text !== p.short_he && !isUsageLine(p, text)).slice(0, 5);
}

/** Icons uploaded in WordPress (תוכן האתר > קטלוג): name → image. */
export function uploadedIcons(s: Settings): Record<string, string> {
  return Object.fromEntries((s.popup_icons ?? []).filter((i) => i.title?.trim() && i.text?.trim()).map((i) => [iconKey(i.title), i.text.trim()]));
}

function withSrcSets(spread: AlbumSpread, media?: MediaSizes): AlbumSpread {
  return { ...spread, imageSrcSet: srcSetFor(spread.image, media), sceneSrcSet: srcSetFor(spread.scene, media) };
}

/** What the phone flip book shows around the product pages; every field is a WordPress setting. */
export type PhoneBook = {
  cover: string;
  backCover: string;
  /** Full-page images between the cover and the table of contents. */
  openers: { title: string; src: string }[];
  footnote: string;
  endText: string;
  tagline: string;
  agents: { name: string; phone?: string }[];
};

export function buildPhoneBook(settings: Settings): PhoneBook {
  return {
    cover: settings.mbook_cover,
    backCover: settings.mbook_back_cover,
    openers: settings.mbook_pages.map((page) => ({ title: page.title, src: page.text.trim() })).filter((page) => page.src),
    footnote: settings.mbook_footnote,
    endText: [settings.mbook_end_text, settings.contact_agents_title].filter(Boolean).join("\n"),
    tagline: settings.mbook_tagline,
    agents: settings.solutions_agents.map(({ name, phone }) => ({ name, phone })),
  };
}

/** The book's own words (WordPress > תוכן האתר > קטלוג), picked so the client bundle stays small. */
export type AlbumLabels = Pick<Settings, "pp_pdf" | "catalog_toc" | "catalog_page" | "catalog_jump" | "catalog_go" | "catalog_jump_err" | "product_open" | "pp_sheet_btn" | "pp_drawing" | "pp_install"> & {
  /** Uploaded highlight icons, for the book in the popup's design. */
  icons: Record<string, string>;
};

export function albumLabels(s: Settings): AlbumLabels {
  return {
    pp_pdf: s.pp_pdf, catalog_toc: s.catalog_toc, catalog_page: s.catalog_page, catalog_jump: s.catalog_jump, catalog_go: s.catalog_go, catalog_jump_err: s.catalog_jump_err,
    // WordPress > תוכן האתר > קטלוג: "book" shows each product in the popup's design on the book's own pages,
    // "popup" opens a product over the book, anything else its own page.
    product_open: s.product_open === "book" || s.product_open === "popup" ? s.product_open : "page",
    pp_sheet_btn: s.pp_sheet_btn, pp_drawing: s.pp_drawing, pp_install: s.pp_install,
    icons: s.product_open === "book" ? uploadedIcons(s) : {},
  };
}
