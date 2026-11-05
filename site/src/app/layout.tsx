import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SheetDownloader from "@/components/products/SheetDownloader";
import { getSettings } from "@/lib/wp";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: [s.site_name, s.seo_suffix].filter(Boolean).join(" | "), template: `%s | ${s.site_name}` },
    description: s.seo_home_desc || s.hero_title.replace(/\n/g, " ").replace(/\*\*/g, ""),
    // Set SITE_NOINDEX=1 while the site lives on a temporary preview domain.
    robots: process.env.SITE_NOINDEX === "1" ? { index: false, follow: false } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="he" dir="rtl">
      <body>
        <Header links={settings.nav_links} logoDark={settings.logo_dark} logoLight={settings.logo_light} logoAlt={`${settings.site_name} ${settings.site_tagline}`} />
        <main>{children}</main>
        <Footer settings={settings} />
        <SheetDownloader />
      </body>
    </html>
  );
}
