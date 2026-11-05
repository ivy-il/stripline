"""Persist imagegen originals, encode web assets, and assign verified local product heroes."""
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/imagegen/product-backgrounds'
PUBLIC = ROOT / 'site/public/products/backgrounds'
SAMPLES = ROOT / 'output/imagegen/product-samples'
DATA = ROOT / 'site/src/data/products.json'
PUBLIC.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)

sources = {'eilat': SAMPLES / 'eilat.png', 'obd': SAMPLES / 'obd.png',
           'rcd-rcd-r-rcdh-rcd-rh': SAMPLES / 'rcdh.png'}
for batch in sorted((OUTPUT / 'jobs').glob('*.json')):
    for item in json.loads(batch.read_text(encoding='utf-8')):
        sources[item['slug']] = Path(item['source'])

products = json.loads(DATA.read_text(encoding='utf-8'))
correction_file = OUTPUT / 'corrections.json'
corrections = json.loads(correction_file.read_text(encoding='utf-8')) if correction_file.exists() else {}
for slug, correction in corrections.items():
    sources[slug] = Path(correction['source'])
manifest = []
for p in products:
    slug = p['slug']
    if slug not in sources:
        continue
    version = corrections.get(slug, {}).get('version', 1)
    original = OUTPUT / (f'{slug}.png' if version == 1 else f'{slug}-v{version}.png')
    if not original.exists():
        shutil.copy2(sources[slug], original)
    target = PUBLIC / f'{slug}-v{version}.webp'
    with Image.open(original) as im:
        assert im.width >= 1024 and im.height >= 768, (slug, im.size)
        if not target.exists():
            im.convert('RGB').save(target, 'WEBP', quality=90, method=6)
        manifest.append({'slug': slug, 'code': p['code'], 'original': str(original.relative_to(ROOT)),
                         'hero_image': f'/products/backgrounds/{slug}-v{version}.webp',
                         'width': im.width, 'height': im.height, 'bytes': target.stat().st_size})
    p['hero_image'] = f'/products/backgrounds/{slug}-v{version}.webp'

DATA.write_text(json.dumps(products, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Small review contact sheets; source PNGs and website WebP files are untouched.
for start in range(0, len(manifest), 18):
    group = manifest[start:start+18]
    sheet = Image.new('RGB', (1200, ((len(group)+2)//3)*280), '#efede9')
    draw = ImageDraw.Draw(sheet)
    for n, item in enumerate(group):
        x, y = (n%3)*400, (n//3)*280
        with Image.open(ROOT / item['original']) as im:
            thumb = im.convert('RGB')
            thumb.thumbnail((390, 250))
            sheet.paste(thumb, (x+5, y+25))
        draw.text((x+8,y+5), item['slug'], fill='#24211b')
    sheet.save(OUTPUT / f'review-{start//18+1:02}.jpg', quality=90)

missing = [p['slug'] for p in products if p['slug'] not in sources]
print(json.dumps({'assigned': len(manifest), 'total': len(products), 'missing': missing,
                  'webp_bytes': sum(m['bytes'] for m in manifest)}))
