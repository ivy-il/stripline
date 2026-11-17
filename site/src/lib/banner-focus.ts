import focus from "@/data/banner-focus.json";

/** Where the product sits in a product page banner: see data/banner-focus.json. */
export type BannerFocus = "top" | "upper" | "low";

const LISTS: Record<BannerFocus, readonly string[]> = { top: focus.top, upper: focus.upper, low: focus.low };

/** The banner's file name, readable: WordPress media URLs keep Hebrew names percent-encoded. */
function fileName(url: string): string {
  const name = url.split(/[?#]/)[0].split("/").pop() ?? "";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

/** The listed position of this banner image, or undefined to keep it centred. */
export function bannerFocus(url: string): BannerFocus | undefined {
  const name = fileName(url);
  return (Object.keys(LISTS) as BannerFocus[]).find((k) => LISTS[k].includes(name));
}
