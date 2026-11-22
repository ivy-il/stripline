/** A media URL's file name, readable: WordPress media URLs keep Hebrew names percent-encoded. */
export function mediaFileName(url: string): string {
  const name = url.split(/[?#]/)[0].split("/").pop() ?? "";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}
