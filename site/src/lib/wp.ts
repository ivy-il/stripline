/**
 * Data layer: reads from the WordPress REST API (stripline-headless plugin)
 * when WP_API_URL is configured, otherwise falls back to the bundled JSON seed.
 *
 *   WP_API_URL=https://cms.example.co.il/wp-json/stripline/v1
 */
import type { Family, Product, Project, Settings } from "./types";
import familiesSeed from "@/data/families.json";
import productsSeed from "@/data/products.json";
import projectsSeed from "@/data/projects.json";
import settingsSeed from "@/data/settings.json";
import { familyMembers, mainFamily } from "./design";
import { eilatOverrides } from "./eilat";
import { mediaEntry, mediaKey, type MediaSizes } from "./media-sizes";

const WP = process.env.WP_API_URL?.replace(/\/$/, "");
const REVALIDATE = Number(process.env.WP_REVALIDATE_SECONDS ?? 300);

export const isWpConnected = Boolean(WP);

/**
 * WordPress media is served through this site at /wp-media/* (see next.config rewrites), so images
 * are same-origin: the 3D book and the PDF product sheet draw them onto canvases, which a
 * cross-origin image without CORS headers would taint.
 */
// Both schemes: media saved before the CMS had SSL keeps http:// URLs.
const WP_UPLOADS = WP ? ["https:", "http:"].map((p) => `${p}//${new URL(WP).host}/wp-content/uploads/`) : [];
function proxyMedia(value: unknown): unknown {
  if (typeof value === "string") return WP_UPLOADS.reduce((s, prefix) => s.split(prefix).join("/wp-media/"), value);
  if (Array.isArray(value)) return value.map(proxyMedia);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, proxyMedia(v)]));
  return value;
}

async function wpGet<T>(path: string, tag: string, fallback: T): Promise<T> {
  if (!WP) return fallback;
  try {
    const res = await fetch(`${WP}${path}`, {
      next: { revalidate: REVALIDATE, tags: [tag, "stripline"] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return proxyMedia(await res.json()) as T;
  } catch (err) {
    console.error(`[wp] ${path} failed, using seed data:`, err);
    return fallback;
  }
}

function seedProducts(): Product[] {
  return (productsSeed as unknown as Product[]).map((p) =>
    p.slug === "eilat" ? { ...p, ...eilatOverrides } : p,
  );
}

/**
 * Retain the local supplier documents only when a CMS record has no such field at all (a plugin older
 * than those fields). A field the client emptied in WordPress stays empty, so a drawing can be removed.
 */
function withProductDocuments(product: Product): Product {
  const local = seedProducts().find((p) => p.slug === product.slug);
  if (!local) return product;
  return {
    ...product,
    drawing_image: product.drawing_image ?? local.drawing_image,
    drawing_images: product.drawing_images ?? local.drawing_images,
    drawing_pdf_url: product.drawing_pdf_url ?? local.drawing_pdf_url,
    drawing_note: product.drawing_note ?? local.drawing_note,
    drawing_kind: product.drawing_kind ?? local.drawing_kind,
    installation_pdf_url: product.installation_pdf_url ?? local.installation_pdf_url,
    installation_drawing_image: product.installation_drawing_image ?? local.installation_drawing_image,
    installation_source: product.installation_source ?? local.installation_source,
    install_he: product.install_he ?? local.install_he,
  };
}

/**
 * WordPress sends every field it has saved, emptied ones included, so the client can remove a text;
 * a field never saved there keeps the default copy (src/data/settings.json).
 *
 * The home film was saved with the old preview host (stripline.olas.co.il). The files themselves
 * are the ones in public/video, so those links play from this site.
 */
const PREVIEW_FILM = /^https?:\/\/stripline\.olas\.co\.il(\/video\/hero-[^?#]*)$/;
function filmOnThisSite(url: string): string {
  return url.match(PREVIEW_FILM)?.[1] ?? url;
}

export async function getSettings(): Promise<Settings> {
  const s = await wpGet<Partial<Settings>>("/settings", "settings", {});
  const settings = { ...(settingsSeed as unknown as Settings), ...s };
  settings.hero_video = filmOnThisSite(settings.hero_video);
  settings.hero_video_mobile = filmOnThisSite(settings.hero_video_mobile);
  settings.hero_poster = filmOnThisSite(settings.hero_poster);
  return settings;
}

export async function getFamilies(): Promise<Family[]> {
  const fams = await wpGet<Family[]>("/families", "families", familiesSeed as Family[]);
  return [...fams].sort((a, b) => a.order - b.order);
}

export async function getFamily(slug: string): Promise<Family | undefined> {
  return (await getFamilies()).find((f) => f.slug === slug);
}

/**
 * The plugin's product feed names one family per product (the first WordPress term, by name). A product can be
 * assigned to more than one family in WordPress, so the full list comes from the core REST API (published products
 * only). The main family is the one listed first on the products page (lowest "סדר"), so a jet assigned to both
 * "תריסי אספקה" and "ג׳אטים" keeps "תריסי אספקה" for its breadcrumb, related products and the digital catalog.
 * Exceptions are set by hand in data/primary-families.json (see PRIMARY_FAMILY in lib/design.ts).
 * If that call fails, every product keeps the plugin's single family.
 */
const WP_CORE = WP ? WP.replace(/\/stripline\/v1$/, "/wp/v2") : "";

async function familyAssignments(): Promise<Map<string, string[]> | null> {
  if (!WP_CORE || WP_CORE === WP) return null;
  const get = async <T,>(path: string): Promise<T> => {
    const res = await fetch(`${WP_CORE}${path}`, {
      next: { revalidate: REVALIDATE, tags: ["products", "families", "stripline"] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  };
  try {
    const terms = await get<{ id: number; slug: string }[]>("/sl_family?per_page=100&_fields=id,slug");
    const slugOf = new Map(terms.map((t) => [t.id, t.slug]));
    const out = new Map<string, string[]>();
    for (let page = 1; page < 20; page++) {
      const rows = await get<{ slug: string; sl_family: number[] }[]>(
        `/sl_product?per_page=100&page=${page}&_fields=slug,sl_family`,
      );
      for (const r of rows) out.set(r.slug, r.sl_family.map((id) => slugOf.get(id)).filter((s): s is string => Boolean(s)));
      if (rows.length < 100) break;
    }
    return out;
  } catch (err) {
    console.error("[wp] family assignments failed, using one family per product:", err);
    return null;
  }
}

async function withFamilies(products: Product[]): Promise<Product[]> {
  const assigned = await familyAssignments();
  if (!assigned) return products;
  const order = new Map((await getFamilies()).map((f) => [f.slug, f.order]));
  return products.map((p) => {
    const families = assigned.get(p.slug);
    if (!families || families.length < 2) return p;
    return { ...p, family: mainFamily(p.slug, families, order), families };
  });
}

export async function getProducts(): Promise<Product[]> {
  return withFamilies((await wpGet<Product[]>("/products", "products", seedProducts())).map(withProductDocuments));
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (!WP) return seedProducts().find((p) => p.slug === slug);
  // Do not fall back to seed on 404: draft/trash products must disappear from direct URLs.
  try {
    const res = await fetch(`${WP}/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE, tags: ["products", "stripline"] },
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const [product] = await withFamilies([withProductDocuments(proxyMedia(await res.json()) as Product)]);
    return product;
  } catch (err) {
    console.error(`[wp] /products/${slug} failed:`, err);
    // CMS unreachable: keep seed so local/preview still works; published list remains the source of truth for nav.
    return seedProducts().find((p) => p.slug === slug);
  }
}

export async function getProductsByFamily(family: string): Promise<Product[]> {
  return familyMembers(await getProducts(), family);
}

/** WordPress keeps non-Latin slugs percent-encoded (יפעתי → %d7%99…); links and folders use the readable form. */
function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function getProjects(): Promise<Project[]> {
  const projects = await wpGet<Project[]>("/projects", "projects", projectsSeed as Project[]);
  return projects.map((p) => ({ ...p, slug: decodeSlug(p.slug) }));
}

export async function getProject(slug: string): Promise<Project | undefined> {
  // The route param can still be encoded (the static export prerenders /projects/%D7%99…).
  const wanted = decodeSlug(slug);
  return (await getProjects()).find((p) => p.slug === wanted);
}

/**
 * The resized copies WordPress keeps of each image (see media-sizes.ts). Read from the plugin's
 * /media route when it has one, otherwise from WordPress's own media listing, page by page. Any
 * failure leaves the map empty, and the images are shown at their original size.
 */
export async function getMediaSizes(): Promise<MediaSizes> {
  if (!WP) return {};
  const cache = { next: { revalidate: REVALIDATE, tags: ["media", "stripline"] }, headers: { Accept: "application/json" } };
  try {
    const own = await fetch(`${WP}/media`, cache);
    if (own.ok) {
      const map = proxyMedia(await own.json()) as MediaSizes;
      return Object.fromEntries(Object.entries(map).map(([url, entry]) => [mediaKey(url), entry]));
    }
    const core = `${new URL(WP).origin}/wp-json/wp/v2/media?per_page=100&_fields=source_url,media_details`;
    const out: MediaSizes = {};
    for (let page = 1, pages = 1; page <= pages && page <= 50; page++) {
      const res = await fetch(`${core}&page=${page}`, cache);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      pages = Number(res.headers.get("x-wp-totalpages")) || 1;
      const items = proxyMedia(await res.json()) as { source_url?: string; media_details?: Parameters<typeof mediaEntry>[0] }[];
      for (const item of items) {
        const entry = item.source_url && item.media_details ? mediaEntry(item.media_details) : null;
        if (entry) out[mediaKey(item.source_url!)] = entry;
      }
    }
    return out;
  } catch (err) {
    console.error("[wp] media sizes failed, showing original images:", err);
    return {};
  }
}
