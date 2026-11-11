"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderSearch from "@/components/HeaderSearch";
import { hasPhotoHero } from "@/lib/design";
import type { SearchableProduct } from "@/lib/product-search";
import type { Link as NavLink } from "@/lib/types";

/** The menu and both logos come from WordPress > תוכן האתר > כללי. */
export default function Header({
  links,
  logoDark,
  logoLight,
  logoAlt,
  products,
  searchLabels,
}: {
  links: NavLink[];
  logoDark: string;
  logoLight: string;
  logoAlt: string;
  products: SearchableProduct[];
  searchLabels: { search: string; none: string; more: string };
}) {
  // An ISR regeneration of the home page renders with the pathname "/index"; React keeps that server class after hydration.
  const raw = usePathname();
  const path = raw === "/index" ? "/" : raw;
  // The phone menu belongs to the page it was opened on, so it closes on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const photo = hasPhotoHero(path);
  // The bar is light everywhere except the contact page, where it is dark.
  const dark = path.startsWith("/contact");

  useEffect(() => {
    // The header is pinned and turns solid once the page scrolls (design: .hdr.scrolled).
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
  }, [path]);

  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  // Home (first) and the catalog (before the contact link) always have their own menu items, even if the CMS menu leaves them out.
  const withCatalog = links.some((n) => n.href === "/catalog") ? links : (() => {
    const at = links.findIndex((n) => n.href === "/contact");
    const item = { label: "קטלוג", href: "/catalog" };
    return at < 0 ? [...links, item] : [...links.slice(0, at), item, ...links.slice(at)];
  })();
  const nav = withCatalog.some((n) => n.href === "/") ? withCatalog : [{ label: "דף הבית", href: "/" }, ...withCatalog];

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const cls = [
    "hdr",
    dark ? "dark" : "",
    scrolled ? (dark ? "on-photo" : "") : photo ? "on-photo" : "",
    scrolled ? "scrolled" : "",
    open ? "open" : "",
    searchOpen ? "search-open" : "",
  ].filter(Boolean).join(" ");

  const toggleSearch = () => {
    setSearchOpen((v) => {
      const next = !v;
      if (next) setOpenOn(null);
      return next;
    });
  };

  return (
    <header data-section="header" className={cls} id="hdr">
      <div className="wrap">
        <div className="hdr-brand">
          <Link href="/" className="logo">
            {/* eslint-disable @next/next/no-img-element */}
            <img className="ld" src={logoDark} alt={logoAlt} />
            <img className="lw" src={logoLight} alt={logoAlt} />
            {/* eslint-enable @next/next/no-img-element */}
          </Link>
          <button
            type="button"
            className="hdr-search-btn"
            data-hdr-search-toggle
            aria-label={searchLabels.search}
            aria-expanded={searchOpen}
            aria-controls="hdr-search-panel"
            onClick={toggleSearch}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M20 20l-4.8-4.8" />
            </svg>
          </button>
        </div>
        <nav aria-label="ניווט ראשי" id="mainnav">
          {nav.map((n) => (
            <Link key={n.href + n.label} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <button className="burger" aria-label="תפריט" aria-expanded={open} aria-controls="mainnav" onClick={() => { setSearchOpen(false); setOpenOn(open ? null : path); }}>
          <span /><span /><span />
        </button>
      </div>
      <div id="hdr-search-panel">
        <HeaderSearch
          products={products}
          labels={searchLabels}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      </div>
    </header>
  );
}
