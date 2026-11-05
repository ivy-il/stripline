import HeroSlides from "./HeroSlides";
import type { Settings } from "@/lib/types";

export default function Hero({ settings }: { settings: Settings }) {
  const images = [settings.hero_image, ...settings.hero_slides.filter((src) => src !== settings.hero_image)];
  return (
    <section className="home-hero">
      <div data-anim="settle" className="home-hero-image">
        <HeroSlides images={images} alt="חללים מעוצבים עם מפזרי אוויר של STRIPLINE המשתלבים בתקרה" />
      </div>
      <div className="home-hero-copy">
        <h1 data-anim="heading" data-anim-delay="0.15">{settings.hero_title}</h1>
        <span data-anim="rule" data-anim-delay="0.45" className="home-hero-rule" />
        <p data-anim="up" data-anim-delay="0.6">{settings.hero_subtitle}</p>
      </div>
    </section>
  );
}
