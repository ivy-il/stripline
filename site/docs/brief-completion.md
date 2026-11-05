# Completion of striplineAppx.pdf

The first two pages specify the homepage, EILAT product layout, technical drawing / installation dialogs and a branded A4 PDF. Pages 3–134 contain the supplier catalog. Later user instructions take precedence over the homepage illustration (viewport-height desktop layout, Rubik, RTL 3D book and no floating motion).

## Implemented

- Original technical drawings extracted for 54 products. Images drive previews; PDFs preserve the source vectors and all drawing variants. `public/products/drawings/source-manifest.json` records the exact source pages and regions.
- Drawing dialog downloads the drawing PDF instead of silently downloading a full marketing sheet. Products without a separate diagram link to their actual catalog entry; no invented generic dimensions are displayed.
- Installation dialog includes the product image and original diagram. For products without authored Hebrew instructions, only supplier assembly information is used; generic installation methods are not imposed on unrelated products.
- Product headings use the model code. All 60 supplier catalog entries have individually assigned architectural backgrounds following the approved EILAT visual direction. Original PNGs, optimized WebP assets, exact prompts and asset assignments are retained in the project; see `product-backgrounds.md`.
- Branded product sheet includes the image, features, specifications, complete installation/accessory lists, original drawing, finishes, contacts and a QR linking to the product page.
- PDF export waits for fonts, images and QR; retains A4 proportions, uses additional pages for long content, and reports failed exports. The preview scrolls internally on narrow screens.

## Source limitations

- No DWG files were included. The UI explains that these have not been supplied instead of offering a fake download.
- The telephone number in the brief is a placeholder; it is excluded from exported sheets until a real number is configured.
- EILAT marketing dimensions / assembly instructions in the design sketch differ from the supplier catalog diagram (45 mm versus 40 mm, opening / outer dimensions, screw mounting versus a hidden frame). Its technical content now follows supplier catalog pages 7–8: 40 mm depth, L × H connection, outer dimensions (L + 55.4) × (H + 55.4), screw mounting and ADP IZ/N adapter. The sketch remains the visual reference.
- Source technical text for other products remains available in the original supplier language and full source PDF; the document does not provide Hebrew translations of that catalog.
