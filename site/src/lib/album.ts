import type { Family, Product, Settings } from "./types";
import { productImage } from "./design";
import { productFeatures, productSizes, productUsage } from "./product-text";

/** One open spread of the flip book: an atmosphere photo facing the product's page. */
export type AlbumSpread = {
  slug: string;
  code: string;
  name: string;
  familyName: string;
  familyNameEn: string;
  image: string;
  scene: string;
  description: string;
  features: string[];
  sizes: string[];
  materials: string[];
  usage: string;
};

export function buildAlbumSpreads(settings: Settings, families: Family[], products: Product[]): AlbumSpread[] {
  return families.flatMap((family) =>
    products.filter((p) => p.family === family.slug).map((p) => ({
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
    })),
  );
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
export type AlbumLabels = Pick<Settings, "pp_pdf" | "catalog_toc" | "catalog_page" | "catalog_jump" | "catalog_go" | "catalog_jump_err">;

export function albumLabels(s: Settings): AlbumLabels {
  return { pp_pdf: s.pp_pdf, catalog_toc: s.catalog_toc, catalog_page: s.catalog_page, catalog_jump: s.catalog_jump, catalog_go: s.catalog_go, catalog_jump_err: s.catalog_jump_err };
}
