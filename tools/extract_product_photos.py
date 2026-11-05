"""Extract complete catalog photographs, including PDF images stored as tiles."""
import json
from pathlib import Path
import fitz

root = Path(__file__).resolve().parents[1]
doc = fitz.open(root / 'striplineAppx.pdf')
data_file = root / 'site/src/data/products.json'
products = json.loads(data_file.read_text(encoding='utf-8'))
out = root / 'site/public/products/photos'
out.mkdir(parents=True, exist_ok=True)
manifest = []
for product in products:
    index = product['catalog_pages'][0] + 2
    page = doc[index]
    headings = page.search_for('Description')
    bottom = min((r.y0 for r in headings if r.y0 > 150), default=470) - 8
    right_sidebar = any(r.x0 > page.rect.width - 70 for r in page.search_for('GRILLES'))
    left = 30 if right_sidebar else 70
    right = page.rect.width - (70 if right_sidebar else 26)
    regions = [fitz.Rect(image['bbox']) for image in page.get_image_info()
               if left < (image['bbox'][0] + image['bbox'][2]) / 2 < right
               and 85 < (image['bbox'][1] + image['bbox'][3]) / 2 < bottom]
    if not regions:
        continue
    clip = regions[0]
    for region in regions[1:]:
        clip |= region
    clip = fitz.Rect(max(left, clip.x0 - 6), max(85, clip.y0 - 6), min(right, clip.x1 + 6), min(bottom, clip.y1 + 6))
    page.get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip).save(out / f"{product['slug']}.png")
    product['image'] = f"/products/photos/{product['slug']}.png"
    manifest.append({'slug': product['slug'], 'source_page': index + 1, 'region': list(clip), 'tiles': len(regions)})
data_file.write_text(json.dumps(products, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(out / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Extracted complete photographs for {len(manifest)} products')
