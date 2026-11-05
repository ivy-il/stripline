"""Extract the three uncoded accessories directly from their supplier PDF pages."""
import json
from pathlib import Path
import fitz

root = Path(__file__).resolve().parents[1]
doc = fitz.open(root / 'striplineAppx.pdf')
out = root / 'site/public/products/photos'
regions = [
    ('special-parts', 119, (120, 538, 476, 706)),
    ('mounting-spring', 120, (200, 582, 495, 724)),
    ('mounting-clips', 121, (238, 609, 422, 779)),
]
manifest = []
for slug, page, region in regions:
    doc[page - 1].get_pixmap(matrix=fitz.Matrix(3, 3), clip=fitz.Rect(region)).save(out / f'{slug}.png')
    manifest.append({'slug': slug, 'source_page': page, 'region': region})
(out / 'accessory-source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Extracted {len(manifest)} accessory photographs')
