import AlbumRedirect from "./AlbumRedirect";

/** The album book now lives at /catalog; old links keep working (redirected in the browser, so it works as static HTML). */
export default function AlbumPage() {
  return <AlbumRedirect />;
}
