"use client";

import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Page-level motion, driven by `data-anim` attributes in server-rendered markup:
 *   heading  lines rise out of a mask          up        fade and rise
 *   stagger  direct children fade in turn      reveal    clip opens top-down, image settles
 *   parallax inner image drifts with scroll    rule      hairline draws from the start edge
 *   count    number counts up                  settle    image eases in from a slight zoom
 *   batch    children stagger as they scroll in (safe for client-filtered lists)
 * `data-anim-delay` (seconds) offsets an element inside the first screen.
 * Every mode but batch and parallax is pre-hidden in CSS to avoid a flash before hydration.
 */
const EASE = "expo.out";

// CSS hover transitions on transform would smear GSAP's per-frame values; mute them meanwhile.
const mute = (els: Element[]) => els.forEach((e) => ((e as HTMLElement).style.transition = "none"));
const unmute = (els: Element[]) => els.forEach((e) => ((e as HTMLElement).style.transition = ""));

export default function PageMotion() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const root = document.querySelector("main");
      if (!root) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const all = Array.from(root.querySelectorAll<HTMLElement>("[data-anim]"));
        const fold = window.innerHeight * 0.92;

        // Elements already on screen play as a staged intro; the rest wait for scroll.
        const trigger = (el: HTMLElement, tween: gsap.core.Timeline | gsap.core.Tween) => {
          const delay = Number(el.dataset.animDelay ?? 0);
          if (el.getBoundingClientRect().top < fold) {
            tween.delay(0.1 + delay);
            tween.play();
          } else {
            ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tween.play() });
          }
        };

        for (const el of all) {
          const mode = el.dataset.anim;

          if (mode === "heading") {
            gsap.set(el, { autoAlpha: 1 });
            const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "anim-line" });
            const tl = gsap.timeline({ paused: true, onComplete: () => split.revert() });
            tl.from(split.lines, { yPercent: 105, duration: 1.1, ease: EASE, stagger: 0.09 });
            trigger(el, tl);
          } else if (mode === "up") {
            mute([el]);
            trigger(el, gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", paused: true, clearProps: "transform", onComplete: () => unmute([el]) }));
          } else if (mode === "stagger") {
            gsap.set(el, { autoAlpha: 1 });
            const items = Array.from(el.children);
            mute(items);
            gsap.set(items, { autoAlpha: 0, y: 20 });
            trigger(el, gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, paused: true, clearProps: "transform", onComplete: () => unmute(items) }));
          } else if (mode === "reveal") {
            gsap.set(el, { autoAlpha: 1 });
            const img = el.querySelector("img");
            const tl = gsap.timeline({ paused: true });
            tl.fromTo(el, { clipPath: "inset(0% 0% 100% 0% round 10px)" }, { clipPath: "inset(0% 0% 0% 0% round 10px)", duration: 1.25, ease: "expo.inOut", clearProps: "clipPath" });
            if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: EASE, clearProps: "transform" }, 0.1);
            trigger(el, tl);
          } else if (mode === "settle") {
            gsap.set(el, { autoAlpha: 1 });
            const target = el.querySelector("img") ?? el;
            trigger(el, gsap.fromTo(target, { scale: 1.1, autoAlpha: 0.4 }, { scale: 1, autoAlpha: 1, duration: 1.8, ease: EASE, paused: true, clearProps: "transform,opacity,visibility" }));
          } else if (mode === "rule") {
            gsap.set(el, { autoAlpha: 1 });
            trigger(el, gsap.fromTo(el, { scaleX: 0, transformOrigin: "100% 50%" }, { scaleX: 1, duration: 1.2, ease: EASE, paused: true }));
          } else if (mode === "count") {
            const end = parseInt(el.textContent ?? "", 10);
            gsap.set(el, { autoAlpha: 1 });
            if (Number.isNaN(end)) continue;
            const counter = { value: 0 };
            el.textContent = "0";
            trigger(el, gsap.to(counter, {
              value: end, duration: 1.6, ease: "power2.out", paused: true,
              onUpdate: () => { el.textContent = String(Math.round(counter.value)); },
            }));
          } else if (mode === "parallax") {
            const img = el.querySelector("img");
            if (!img) continue;
            gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, {
              yPercent: 6, ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
            });
          } else if (mode === "batch") {
            // Only items below the fold are hidden, so nothing already visible ever flashes.
            const items = Array.from(el.children).filter((c) => c.getBoundingClientRect().top > fold);
            if (!items.length) continue;
            mute(items);
            gsap.set(items, { autoAlpha: 0, y: 18 });
            ScrollTrigger.batch(items, {
              start: "top 92%",
              once: true,
              onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.06, clearProps: "transform", onComplete: () => unmute(batch) }),
            });
          }
        }

        // Images and fonts can shift layout after the first measure.
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh, { once: true });
        document.fonts?.ready.then(refresh);
        return () => window.removeEventListener("load", refresh);
      });

      return () => mm.revert();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
