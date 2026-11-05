"""Extract original vector technical drawings; never synthesize dimensions."""
import json
from pathlib import Path
import fitz
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
doc = fitz.open(ROOT / 'striplineAppx.pdf')
data_path = ROOT / 'site/src/data/products.json'
products = json.loads(data_path.read_text(encoding='utf-8'))
out = ROOT / 'site/public/products/drawings'
out.mkdir(parents=True, exist_ok=True)
manifest = []
for product in products:
    if product['slug'] in ('tub', 'adp', 'fil', 'special-parts', 'mounting-spring', 'mounting-clips'):
        continue
    regions = []
    for index in range(product['catalog_pages'][0] + 2, product['catalog_pages'][1] + 3):
        page = doc[index]
        hits = page.search_for('Technical design')
        if not hits:
            continue
        heading = hits[0]
        # Alternating supplier pages move the navigation strip to the right.
        left = heading.x0 - 12
        right_sidebar = any(r.x0 > page.rect.width - 70 for r in page.search_for('GRILLES'))
        right = page.rect.width - (70 if right_sidebar else 26)
        bottom = page.rect.height - 45
        if product['slug'] == 'cc':
            bottom = 588
        for title in ['Assembly Method', 'Order codes', 'Annotation', 'Selection table', 'Mounting Clips']:
            for match in page.search_for(title):
                if match.x0 >= left and match.y0 > heading.y1 + 12:
                    bottom = min(bottom, match.y0 - 5)
        # A few dimension labels share the heading's baseline (e.g. EILAT 40).
        # Include that line so no supplier dimensions are cut off.
        clip = fitz.Rect(left, heading.y0 - 3, right, bottom)
        if clip.height > 30:
            # Trim empty margins without rasterizing the exported vector drawing.
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip)
            raster = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
            bounds = ImageChops.difference(raster, Image.new('RGB', raster.size, 'white')).convert('L').point(lambda v: 255 if v > 24 else 0).getbbox()
            if bounds:
                origin_x, origin_y = pix.x / 2, pix.y / 2
                clip = fitz.Rect(origin_x + bounds[0] / 2 - 6, origin_y + bounds[1] / 2 - 6, origin_x + bounds[2] / 2 + 6, origin_y + bounds[3] / 2 + 6) & clip
            regions.append((index, clip))
    if not regions:
        continue
    # Keep every diagram variant from the supplier on separate pages.
    result = fitz.open()
    for index, clip in regions:
        target = result.new_page(width=clip.width + 24, height=clip.height + 24)
        target.show_pdf_page(fitz.Rect(12, 12, clip.width + 12, clip.height + 12), doc, index, clip=clip)
    slug = product['slug']
    result.save(out / f'{slug}.pdf', garbage=4, deflate=True)
    result[0].get_pixmap(matrix=fitz.Matrix(3, 3)).save(out / f'{slug}.png')
    product['drawing_image'] = f'/products/drawings/{slug}.png'
    product['drawing_images'] = []
    for number, page in enumerate(result):
        filename = f'{slug}-{number + 1}.png'
        page.get_pixmap(matrix=fitz.Matrix(3, 3)).save(out / filename)
        product['drawing_images'].append(f'/products/drawings/{filename}')
    product['drawing_pdf_url'] = f'/products/drawings/{slug}.pdf'
    product['drawing_note'] = 'שרטוט היצרן מתוך הקטלוג. המידות במ״מ אלא אם צוין אחרת.'
    first = Image.open(out / f'{slug}.png')
    index, first_clip = regions[0]
    first_heading = doc[index].search_for('Technical design')[0]
    # Remove only the redundant heading from the installation illustration;
    # the source vector PDF remains intact, including every dimension label.
    heading_box = [(first_heading.x0 - first_clip.x0 + 12) * 3 - 2,
                   (first_heading.y0 - first_clip.y0 + 12) * 3 - 2,
                   (first_heading.x1 - first_clip.x0 + 12) * 3 + 2,
                   (first_heading.y1 - first_clip.y0 + 12) * 3 + 2]
    ImageDraw.Draw(first).rectangle(heading_box, fill='white')
    first_bounds = ImageChops.difference(first.convert('RGB'), Image.new('RGB', first.size, 'white')).convert('L').point(lambda v: 255 if v > 24 else 0).getbbox()
    if first_bounds:
        first = first.crop(first_bounds)
    if first.width / first.height < .55:
        first = first.rotate(270, expand=True)
    first.save(out / f'{slug}-installation.png')
    product['installation_drawing_image'] = f'/products/drawings/{slug}-installation.png'
    manifest.append({'slug': slug, 'source_pages': [i + 1 for i, _ in regions], 'regions': [list(r) for _, r in regions]})
data_path.write_text(json.dumps(products, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(out / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Extracted original drawings for {len(manifest)} products')
