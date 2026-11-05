/** The design's hairline arrow; it points left, the reading direction for "onwards" in Hebrew. */
export default function Arrow({ size = 26, weight = 1.3, className }: { size?: number; weight?: number; className?: string }) {
  return (
    <svg width={size} height={12} viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth={weight} aria-hidden="true" className={className}>
      <path d="M26 6H1M6 1L1 6l5 5" />
    </svg>
  );
}

/** The STRIPLINE wordmark set inside running text (styled by `.lg` in design.css). */
export function Lg() {
  return <span className="lg" role="img" aria-label="STRIPLINE" />;
}

export function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.7z" />
      <path d="M9 9.5c.3 2 1.8 3.8 3.9 4.6l1.2-1.2 1.9.8-.4 1.6c-3.6-.2-6.6-3.2-6.8-6.8l1.6-.4.8 1.9z" />
    </svg>
  );
}
