import data from "@/data/grey-backdrop.json";
import { mediaFileName } from "@/lib/media-name";

const FILES = new Set(data.files);

/**
 * The tile image class for a product image shot on a grey background (data/grey-backdrop.json):
 * it blends with "darken" so its grey merges into the tile (see .on-grey in app/design.css).
 */
export function backdropClass(url: string | undefined): string | undefined {
  return url && FILES.has(mediaFileName(url)) ? "on-grey" : undefined;
}
