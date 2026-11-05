"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasPhotoHero } from "@/lib/design";
import type { Link as NavLink } from "@/lib/types";

/** The menu and both logos come from WordPress > תוכן האתר > כללי. */
export default function Header({ links, logoDark, logoLight, logoAlt }: { links: NavLink[]; logoDark: string; logoLight: string; logoAlt: string }) {
  // An ISR regeneration of the home page renders with the pathname "/index"; React keeps that server class after hydration.
  const raw = usePathname();
  const path = raw === "/index" ? "/" : raw;
  // The phone menu belongs to the page it was opened on, so it closes on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
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

  // Home (first) and the catalog (before the contact link) always have their own menu items, even if the CMS menu leaves them out.
  const withCatalog = links.some((n) => n.href === "/catalog") ? links : (() => {
    const at = links.findIndex((n) => n.href === "/contact");
    const item = { label: "קטלוג", href: "/catalog" };
    return at < 0 ? [...links, item] : [...links.slice(0, at), item, ...links.slice(at)];
  })();
  const nav = withCatalog.some((n) => n.href === "/") ? withCatalog : [{ label: "דף הבית", href: "/" }, ...withCatalog];

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const cls = ["hdr", dark ? "dark" : "", scrolled ? (dark ? "on-photo" : "") : photo ? "on-photo" : "", scrolled ? "scrolled" : "", open ? "open" : ""].filter(Boolean).join(" ");

  return (
    <header data-section="header" className={cls} id="hdr">
      <div className="wrap">
        <Link href="/" className="logo">
          {/* eslint-disable @next/next/no-img-element */}
          <img className="ld" src={logoDark} alt={logoAlt} />
          <img className="lw" src={logoLight} alt={logoAlt} />
          {/* eslint-enable @next/next/no-img-element */}
        </Link>
        <button className="burger" aria-label="תפריט" aria-expanded={open} aria-controls="mainnav" onClick={() => setOpenOn(open ? null : path)}>
          <span /><span /><span />
        </button>
        <nav aria-label="ניווט ראשי" id="mainnav">
          {nav.map((n) => (
            <Link key={n.href + n.label} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
