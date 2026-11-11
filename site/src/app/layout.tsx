import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SheetDownloader from "@/components/products/SheetDownloader";
import { getFamilies, getProducts, getSettings } from "@/lib/wp";

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
  const [settings, products, families] = await Promise.all([getSettings(), getProducts(), getFamilies()]);
  const familyNames = Object.fromEntries(families.map((f) => [f.slug, f.name_he]));
  const searchIndex = products.map((p) => ({
    slug: p.slug,
    code: p.code,
    name: p.name_he,
    family: p.family,
    familyName: familyNames[p.family] ?? "",
    nameEn: p.name,
    codes: p.codes,
    image: p.image,
  }));

  return (
    <html lang="he" dir="rtl">
      <body>
        <Header
          links={settings.nav_links}
          logoDark={settings.logo_dark}
          logoLight={settings.logo_light}
          logoAlt={`${settings.site_name} ${settings.site_tagline}`}
          products={searchIndex}
          searchLabels={{
            search: settings.products_search,
            none: settings.products_none,
            more: settings.products_more,
          }}
        />
        <main>{children}</main>
        <Footer settings={settings} />
        <SheetDownloader />
      </body>
    </html>
  );
}
