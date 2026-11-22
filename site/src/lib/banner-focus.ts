import focus from "@/data/banner-focus.json";
import { mediaFileName } from "@/lib/media-name";

/** Where the product sits in a product page banner: see data/banner-focus.json. */
export type BannerFocus = "top" | "high" | "upper" | "low";

const LISTS: Record<BannerFocus, readonly string[]> = { top: focus.top, high: focus.high, upper: focus.upper, low: focus.low };

/** The listed position of this banner image, or undefined to keep it centred. */
export function bannerFocus(url: string): BannerFocus | undefined {
  const name = mediaFileName(url);
  return (Object.keys(LISTS) as BannerFocus[]).find((k) => LISTS[k].includes(name));
}

/** The banner image class for its listed position (see app/site.css), or undefined to keep it centred. */
export function bannerFocusClass(url: string | undefined): string | undefined {
  const focus = url ? bannerFocus(url) : undefined;
  return focus ? `focus-${focus}` : undefined;
}
