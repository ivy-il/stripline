# Catalog book source

The owner requested the model from Wawa Sensei's animated book slider.

- Starter: https://github.com/wass08/r3f-animated-book-slider-starter
  Revision: `491f793c52ca8f4804c6073a80ce4c1f4cf939d5`.
  This repository contains the scene scaffold; its README links to the finished book.
- Finished implementation: https://github.com/wass08/r3f-animated-book-slider-final
  Revision: `8eede2f7036fa9085a195dbf2aba11e053f6348b`.

`src/lib/catalog-book-geometry.ts` adapts the original Book.jsx geometry, 30-segment skeleton, curve strengths and maath damping. Units are uniformly enlarged. The complete volume is mirrored for Hebrew reading and printed textures are counter-mirrored to keep the text readable. Original bone rotation signs and stack offsets remain intact. The outer skin index is bounded to the last valid bone. Procedural linen roughness replaces the source's Wawa-logo-pattern roughness image so the cover carries only STRIPLINE branding.

`catalog-book-scene.ts` hosts the model directly in Three.js within Next.js, with the original tilted volume, shadows and orbit controls. Floating movement is disabled as requested. The catalog's 76 editable HTML pages become 38 two-sided leaves and include all 60 product entries. Textures are prepared around the current spread and disposed outside a bounded neighborhood. Product clicks use raycasting against the deformed pages. Keyboard controls and accessible page content accompany the canvas; the HTML flipbook remains the WebGL fallback.

The homepage continues to use its photographed book shell and separate scene.

Rendering corrections: stack offsets follow each leaf's normal, rather than the original fixed binding-Z axis, to prevent coplanar closed surfaces. Leaves have a small gap. Paper casts the floor shadow but does not receive shadow-map noise. Device pixel ratio is capped at 2 for sharper edges.
