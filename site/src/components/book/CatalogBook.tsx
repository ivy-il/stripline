"use client";

import { useSearchParams } from "next/navigation";
import AlbumBook from "./AlbumBook";

type Props = Omit<React.ComponentProps<typeof AlbumBook>, "start">;

/** The /catalog book, opened on the product in ?product=slug. Read in the browser so the page stays static HTML. */
export default function CatalogBook(props: Props) {
  const product = useSearchParams().get("product");
  const start = Math.max(0, props.spreads.findIndex((s) => s.slug === product));
  return <AlbumBook {...props} start={start} />;
}
