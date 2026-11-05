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
import { eilatOverrides } from "./eilat";

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

export async function getProducts(): Promise<Product[]> {
  return (await wpGet<Product[]>("/products", "products", seedProducts())).map(withProductDocuments);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (!WP) return seedProducts().find((p) => p.slug === slug);
  // Same seed fallback as getProducts(), or an unreachable CMS lists products whose pages then 404.
  const seed = seedProducts().find((p) => p.slug === slug) ?? null;
  const p = await wpGet<Product | null>(`/products/${encodeURIComponent(slug)}`, "products", seed);
  return p ? (p === seed ? p : withProductDocuments(p)) : undefined;
}

export async function getProductsByFamily(family: string): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.family === family);
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
