declare module "page-flip" {
  export type SizeType = "fixed" | "stretch";
  export interface FlipSetting {
    startPage?: number;
    size?: SizeType;
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }
  export type FlipEvent = { data: number | string | object; object: PageFlip };
  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSetting);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    loadFromImages(images: string[]): void;
    destroy(): void;
    update(): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    getCurrentPageIndex(): number;
    getSettings(): FlipSetting & { flippingTime: number };
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    getBoundsRect(): { width: number; height: number; left: number; top: number; pageWidth: number };
    on(event: "flip" | "changeOrientation" | "changeState" | "init" | "update", cb: (e: FlipEvent) => void): void;
    off(event: string): void;
  }
}
