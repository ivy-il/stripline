"""Check all product document assets and their actual localhost downloads."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
import collections
import json
import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'site/public'
products = json.loads((ROOT / 'site/src/data/products.json').read_text(encoding='utf-8'))
assert len(products) == 60
urls, pdf_count, pages = [], 0, 0
for p in products:
    assert p['install_he'] and all(section['items'] for section in p['install_he']), p['slug']
    for key in ('drawing_image', 'installation_drawing_image'):
        with Image.open(PUBLIC / p[key].lstrip('/')) as image:
            image.verify()
    for src in p['drawing_images']:
        assert (PUBLIC / src.lstrip('/')).is_file(), src
    for key in ('drawing_pdf_url', 'installation_pdf_url'):
        path = PUBLIC / p[key].lstrip('/')
        with fitz.open(path) as pdf:
            assert len(pdf) and not pdf.is_encrypted, path
            pdf_count += 1
            pages += len(pdf)
            if key == 'installation_pdf_url':
                assert len(pdf) == 1, f'Unexpected pagination: {p["slug"]}'
                for page in pdf:
                    assert '\ufffd' not in page.get_text(), path
                    for block in page.get_text('dict')['blocks']:
                        for line in block.get('lines', []):
                            for span in line['spans']:
                                rect = fitz.Rect(span['bbox'])
                                assert rect.x0 >= 25 and rect.x1 <= 570 and rect.y0 >= 25 and rect.y1 <= 825, (path, span)
        urls.append(p[key])

def download(path):
    with urlopen('http://localhost:3000' + path, timeout=20) as response:
        assert response.status == 200, path
        assert 'application/pdf' in response.headers['Content-Type'], path
        assert response.read(5) == b'%PDF-', path
    return path

with ThreadPoolExecutor(max_workers=8) as pool:
    downloaded = list(pool.map(download, urls))
assert len(downloaded) == 120
print(f'PASS: {len(products)} products, {pdf_count} valid PDFs ({pages} pages), 120 HTTP downloads, all images and page boundaries.')
print('Drawing provenance:', dict(collections.Counter(p['drawing_kind'] for p in products)))

review = ROOT / 'tmp/pdfs/product-document-review'
sheet = Image.new('RGB', (1200, 1200), '#e8e6e1')
draw = ImageDraw.Draw(sheet)
missing = [p for p in products if p['drawing_kind'] != 'manufacturer']
for i, p in enumerate(missing):
    pdf = fitz.open(PUBLIC / p['drawing_pdf_url'].lstrip('/'))
    pix = pdf[0].get_pixmap(matrix=fitz.Matrix(1, 1))
    image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    image.thumbnail((380, 550))
    x, y = (i % 3) * 400, (i // 3) * 600
    sheet.paste(image, (x + 10, y + 30))
    draw.text((x + 10, y + 8), p['slug'], fill='black')
sheet.save(review / 'technical-supplements.jpg')
