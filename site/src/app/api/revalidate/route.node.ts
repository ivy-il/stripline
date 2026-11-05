import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Called by the WordPress plugin (stripline-headless) after content is saved:
 *   POST /api/revalidate?secret=...   body: { "tags": ["products"] }
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? req.headers.get("x-stripline-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "invalid secret" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { tags?: string[] };
  const tags = body.tags?.length ? body.tags : ["stripline"];
  for (const t of tags) revalidateTag(t, "max");
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true, tags, at: Date.now() });
}
