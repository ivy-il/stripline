"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { parseBookPlace, storedBookPlace } from "@/lib/book-place";

const subscribe = () => () => {};

/**
 * A link to this product's page in the flip book. When the reader opened the product from the book
 * (on /catalog or on the home page), it leads back to that same place, scroll position included;
 * otherwise to the product's page in /catalog. `fromBookOnly` shows it only after opening from the book.
 */
export default function BackToBook({ slug, className, fromBookOnly = false, children }: { slug: string; className?: string; fromBookOnly?: boolean; children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, storedBookPlace, () => null);
  const place = parseBookPlace(raw);
  const fromBook = place?.slug === slug;
  if (fromBookOnly && !fromBook) return null;
  return <Link className={className} href={fromBook ? place.href : `/catalog?product=${encodeURIComponent(slug)}`}>{children}</Link>;
}
