"use client";

import { useEffect } from "react";

const SHEET_LINK = 'a[href*="/sheet?download=1"]';
const TIMEOUT_MS = 60000;

/**
 * "Download PDF" links save the product sheet directly, without opening its preview: the sheet page
 * is built in a hidden frame, makes the PDF there and reports back. If that fails, the preview opens
 * as before, where the visitor can try again.
 */
export default function SheetDownloader() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(SHEET_LINK);
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      if (link.dataset.busy) return;

      const href = link.href;
      const label = link.getAttribute("aria-label");
      link.dataset.busy = "true";
      link.setAttribute("aria-busy", "true");
      link.setAttribute("aria-label", "מכין PDF…");

      // Off screen but laid out at full size, so the sheet renders exactly as in its preview.
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      frame.style.cssText = "position:fixed;left:-12000px;top:0;width:1200px;height:1600px;border:0;opacity:0;pointer-events:none";
      frame.src = href;

      const finish = (ok: boolean) => {
        window.removeEventListener("message", onMessage);
        window.clearTimeout(timer);
        delete link.dataset.busy;
        link.removeAttribute("aria-busy");
        if (label) link.setAttribute("aria-label", label);
        else link.removeAttribute("aria-label");
        // Give the browser a moment to hand the file over before the frame goes away.
        window.setTimeout(() => frame.remove(), 1000);
        if (!ok) window.open(href, "_blank", "noopener");
      };
      const onMessage = (message: MessageEvent) => {
        if (message.origin === window.location.origin && message.source === frame.contentWindow && message.data?.type === "sheet-pdf") finish(Boolean(message.data.ok));
      };
      const timer = window.setTimeout(() => finish(false), TIMEOUT_MS);
      window.addEventListener("message", onMessage);
      document.body.appendChild(frame);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
