import Link from "next/link";
import type { Settings } from "@/lib/types";

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer data-section="footer" className="ftr">
      <div className="wrap">
        <div className="meta">
          <span>{settings.address}</span>
          <span dir="ltr" className="ltr-r">{settings.email}</span>
        </div>
        <Link href="/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo_dark} alt={`${settings.site_name} ${settings.site_tagline}`} />
        </Link>
        <nav aria-label="קישורים משפטיים">
          {settings.footer_links.map((l) => <Link key={l.href + l.label} href={l.href}>{l.label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
