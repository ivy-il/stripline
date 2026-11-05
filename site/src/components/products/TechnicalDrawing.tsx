/**
 * Schematic technical drawing (front + section + install opening) rendered as SVG,
 * used when a product has no uploaded drawing image.
 */
export default function TechnicalDrawing({ code, depth = 45, className = "" }: { code: string; depth?: number; className?: string }) {
  return (
    <svg viewBox="0 0 640 300" className={`w-full h-auto ${className}`} fontFamily="var(--font-body), sans-serif">
      <defs>
        <pattern id="grille" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#f6f4f0" />
          <path d="M0 4 H8" stroke="#8d8880" strokeWidth="1" />
        </pattern>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0 0 L6 3 L0 6 z" fill="#4a4540" />
        </marker>
      </defs>
      {/* front view */}
      <g transform="translate(40 50)">
        <rect x="0" y="0" width="380" height="80" fill="#fff" stroke="#4a4540" strokeWidth="1.5" />
        <rect x="10" y="10" width="360" height="60" fill="url(#grille)" stroke="#4a4540" strokeWidth="1" />
        <line x1="0" y1="-18" x2="380" y2="-18" stroke="#4a4540" strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)" />
        <text x="190" y="-24" textAnchor="middle" fontSize="12" fill="#4a4540">L</text>
        <line x1="-18" y1="0" x2="-18" y2="80" stroke="#4a4540" strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)" />
        <text x="-26" y="44" textAnchor="end" fontSize="12" fill="#4a4540">H</text>
        <text x="0" y="100" fontSize="11" fill="#7a736b">חזית</text>
      </g>
      {/* section */}
      <g transform="translate(480 50)">
        <rect x="0" y="0" width="60" height="80" fill="#fff" stroke="#4a4540" strokeWidth="1.5" />
        <path d="M0 0 L60 8 M0 20 L60 28 M0 40 L60 48 M0 60 L60 68" stroke="#4a4540" strokeWidth="1" />
        <rect x="60" y="14" width="40" height="52" fill="none" stroke="#4a4540" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="0" y1="-18" x2="60" y2="-18" stroke="#4a4540" strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)" />
        <text x="30" y="-24" textAnchor="middle" fontSize="12" fill="#4a4540">{depth}</text>
        <text x="0" y="100" fontSize="11" fill="#7a736b">חתך צד</text>
      </g>
      {/* opening */}
      <g transform="translate(40 190)">
        <rect x="0" y="0" width="380" height="60" fill="none" stroke="#4a4540" strokeWidth="1" strokeDasharray="6 4" />
        <line x1="0" y1="78" x2="380" y2="78" stroke="#4a4540" strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)" />
        <text x="190" y="94" textAnchor="middle" fontSize="12" fill="#4a4540">L − 10</text>
        <line x1="400" y1="0" x2="400" y2="60" stroke="#4a4540" strokeWidth="1" markerStart="url(#arr)" markerEnd="url(#arr)" />
        <text x="408" y="34" fontSize="12" fill="#4a4540">H − 10</text>
        <text x="0" y="-8" fontSize="11" fill="#7a736b">פתח הכנה (מ״מ)</text>
      </g>
      <text x="600" y="290" textAnchor="end" fontSize="11" fill="#b8894a">{code}</text>
    </svg>
  );
}

