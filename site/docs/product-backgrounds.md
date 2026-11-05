# Product installation backgrounds

All 60 supplier catalog entries have separate architectural installation scenes, using the three approved EILAT, round diffuser and OBD samples as the visual direction. Original supplier photographs remain in the specification cards; generated backgrounds illustrate installation context.

- Website assets: `public/products/backgrounds/<slug>-v<version>.webp` (normally version 1; STD uses corrected version 2).
- Product assignment: `src/data/products.json`, field `hero_image`.
- Full-resolution PNG originals: `../output/imagegen/product-backgrounds/<slug>.png`; corrections retain the earlier version and add `<slug>-v2.png`.
- Asset manifest: `../output/imagegen/product-backgrounds/manifest.json`.
- Exact generation prompts and manufacturer reference paths: `../output/imagegen/product-backgrounds/prompts.json` and `extra-prompts.json`.
- Original sample prompts: `../output/imagegen/product-samples/generation-prompts.json`.
- STD square-faceplate correction: `../output/imagegen/product-backgrounds/std-correction-prompt.json`, with the active revision in `corrections.json`.
- Persistence/conversion utility: `../tools/finalize_product_backgrounds.py`.

The 60 entries include the three uncoded accessories on PDF pages 119–121: Special Parts (T/Y connections), Mounting Spring and Mounting Clips. Their original catalog photographs and source regions are recorded in `public/products/photos/accessory-source-manifest.json` and can be extracted with `../tools/extract_accessory_photos.py`. No unavailable dimensions, materials, technical diagrams or DWG files have been invented.

Backgrounds use warm plaster, oak and natural light, with quiet space behind page text. Indoor diffusers, outdoor louvers and internal installation accessories use their appropriate installation contexts. Website copies use WebP quality 90; PNG originals are retained separately.
