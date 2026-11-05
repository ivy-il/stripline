"""Build product-specific Hebrew installation PDFs and missing technical sheets.

Manufacturer vector diagrams are retained separately. Missing dimensioned
drawings are explicitly labeled; schematic geometry is never a CAD substitute.
"""
from pathlib import Path
import json
import shutil
import math
import fitz
from bidi.algorithm import get_display
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from product_installation_content import CONTENT

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'site/public'
DATA = ROOT / 'site/src/data/products.json'
OUTPUT = ROOT / 'output/pdf'
DRAWINGS = PUBLIC / 'products/drawings'
INSTALL = PUBLIC / 'products/installation'
PREVIEWS = ROOT / 'tmp/pdfs/product-document-review'
for directory in (INSTALL, OUTPUT / 'installation', OUTPUT / 'technical', PREVIEWS):
    directory.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Hebrew', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('HebrewBold', 'C:/Windows/Fonts/arialbd.ttf'))
INK = '#242421'
GOLD = '#A77B3D'

def rtl(c, text, x, y, size=10, bold=False, color=INK):
    c.setFillColor(color)
    c.setFont('HebrewBold' if bold else 'Hebrew', size)
    c.drawRightString(x, y, get_display(text, base_dir='R'))

def lines(text, width, size=10):
    result, line = [], ''
    for word in text.split():
        trial = (line + ' ' + word).strip()
        if line and pdfmetrics.stringWidth(get_display(trial, base_dir='R'), 'Hebrew', size) > width:
            result.append(line)
            line = word
        else:
            line = trial
    if line:
        result.append(line)
    return result

def wrapped(c, text, x, y, width, size=10, color=INK):
    for line in lines(text, width, size):
        rtl(c, line, x, y, size=size, color=color)
        y -= size * 1.55
    return y

def image(c, path, x, y, w, h):
    if not path.is_file():
        raise FileNotFoundError(path)
    c.drawImage(ImageReader(str(path)), x, y, w, h, preserveAspectRatio=True, anchor='c', mask='auto')

def frame(c, x, y, w, h):
    c.setStrokeColor('#DDD8CF')
    c.setLineWidth(.6)
    c.roundRect(x, y, w, h, 7, stroke=1, fill=0)

def header(c, p, title):
    c.setTitle(f'STRIPLINE | {p["code"]} | {title}')
    c.setAuthor('STRIPLINE - based on supplied manufacturer catalog')
    c.setFont('Hebrew', 16)
    c.setFillColor(INK)
    c.drawString(36, 793, 'S T R I P L I N E')
    rtl(c, title, 559, 793, size=18, bold=True)
    c.setStrokeColor(GOLD)
    c.line(36, 774, 559, 774)
    rtl(c, p['code'], 559, 746, size=15, bold=True)
    wrapped(c, p['name_he'], 559, 724, 480, size=11, color=GOLD)

def footer(c, p, page=1):
    c.setStrokeColor('#DDD8CF')
    c.line(36, 58, 559, 58)
    a, b = p['catalog_pages']
    source = f'מקור: קטלוג הספק, עמודים {a}-{b}.' if a != b else f'מקור: קטלוג הספק, עמוד {a}.'
    rtl(c, source, 559, 42, size=9)
    rtl(c, 'ללא קנה מידה. המידות והגרסה לפי הזמנה ושרטוט הספק.', 559, 27, size=8, color='#68665F')
    c.setFont('Hebrew', 9)
    c.drawString(36, 42, f'{page} | stripline.co.il')

def installation(p):
    path = OUTPUT / 'installation' / f'{p["slug"]}.pdf'
    c = canvas.Canvas(str(path), pagesize=(595.28, 841.89))
    header(c, p, 'הוראות התקנה')
    # The figures are source product/technical illustrations, not invented assembly details.
    frame(c, 36, 445, 224, 244)
    photo = '/images/eilat-front-v2.png' if p['slug'] == 'eilat' else p['image']
    image(c, PUBLIC / photo.lstrip('/'), 44, 473, 208, 202)
    rtl(c, 'תמונת המוצר', 248, 458, size=9, color=GOLD)
    frame(c, 36, 174, 224, 254)
    image(c, PUBLIC / p.get('installation_drawing_image', p['drawing_image']).lstrip('/'), 44, 207, 208, 207)
    caption = 'פרט חיבור למסגרת CC' if p['slug'] == 'mounting-clips' else ('איור סכמטי / נתוני מוצר' if p.get('drawing_kind') == 'schematic' else 'שרטוט יצרן')
    rtl(c, caption, 248, 188, size=9, color=GOLD)
    y, page = 680, 1
    for section in p['install_he']:
        required = 30 + sum(len(lines(text, 260, 10.5)) * 16.3 + 7 for text in section['items'])
        if y - required < 91:
            footer(c, p, page)
            c.showPage()
            page += 1
            header(c, p, 'הוראות התקנה - המשך')
            y = 680
        rtl(c, section['title'], 559, y, size=12, bold=True, color=GOLD)
        y -= 23
        for text in section['items']:
            rtl(c, '•', 558, y, size=10)
            y = wrapped(c, text, 544, y, 256, size=10.5) - 7
        y -= 12
    footer(c, p, page)
    c.save()
    shutil.copy2(path, INSTALL / path.name)
    p['installation_pdf_url'] = f'/products/installation/{path.name}'
    return path

def schematic(c, slug):
    # Symbolic outlines show the product category only; no unprovided dimensions.
    c.setStrokeColor(INK)
    c.setLineWidth(1.2)
    if slug == 'tub':
        for n in range(16):
            c.ellipse(110 + n * 19, 458, 180 + n * 19, 588)
        c.line(145, 458, 430, 458)
        c.line(145, 588, 430, 588)
    elif slug == 'adp':
        c.rect(115, 452, 305, 112)
        path = c.beginPath()
        path.moveTo(115, 564); path.lineTo(180, 611); path.lineTo(485, 611)
        path.lineTo(420, 564); path.close()
        c.drawPath(path)
        c.line(420, 452, 485, 499); c.line(485, 499, 485, 611)
        c.ellipse(238, 577, 331, 635)
    elif slug == 'fil':
        c.rect(135, 445, 325, 165)
        c.rect(147, 457, 301, 141)
        for n in range(20):
            c.line(147 + n * 15, 457, 147 + n * 15, 598)
        for n in range(10):
            c.line(147, 457 + n * 15, 448, 457 + n * 15)
    elif slug == 'special-parts':
        c.setLineWidth(15)
        for pts in [[(130, 565), (260, 565)], [(195, 565), (195, 457)], [(363, 452), (363, 527)], [(363, 527), (315, 586)], [(363, 527), (418, 586)]]:
            c.line(*pts[0], *pts[1])
        c.setLineWidth(1)
    else:
        # Spring catalog gives a photo and length only; use its real photo.
        image(c, PUBLIC / next(p['image'] for p in products if p['slug'] == slug).lstrip('/'), 110, 437, 370, 210)

def technical(p):
    slug = p['slug']
    path = OUTPUT / 'technical' / f'{slug}.pdf'
    c = canvas.Canvas(str(path), pagesize=(595.28, 841.89))
    header(c, p, 'דף טכני')
    frame(c, 36, 383, 523, 306)
    if slug == 'mounting-clips':
        image(c, DRAWINGS / 'cc.png', 56, 415, 483, 258)
        note = 'פרט חיבור למסגרת CC מתוך קטלוג הספק. אין בקטלוג שרטוט מידות של הקליפס עצמו.'
        p['drawing_kind'] = 'connection'
    else:
        schematic(c, slug)
        note = 'איור סכמטי / תמונת מקור, ללא קנה מידה. קטלוג הספק אינו כולל שרטוט מידות מלא למוצר זה.'
        p['drawing_kind'] = 'schematic'
    wrapped(c, note, 547, 405, 498, size=9, color='#68665F')
    y = 352
    for section in p['install_he']:
        rtl(c, section['title'], 559, y, size=12, bold=True, color=GOLD)
        y -= 21
        for text in section['items']:
            y = wrapped(c, text, 559, y, 510, size=10) - 5
        y -= 8
    assert y > 68, (slug, y)
    footer(c, p)
    c.save()
    shutil.copy2(path, DRAWINGS / path.name)
    document = fitz.open(path)
    document[0].get_pixmap(matrix=fitz.Matrix(2, 2)).save(DRAWINGS / f'{slug}.png')
    document[0].get_pixmap(matrix=fitz.Matrix(2, 2), clip=fitz.Rect(36, 152, 559, 459)).save(DRAWINGS / f'{slug}-illustration.png')
    p['installation_drawing_image'] = f'/products/drawings/{slug}-illustration.png'
    p['drawing_image'] = f'/products/drawings/{slug}-illustration.png'
    p['drawing_images'] = [p['drawing_image']]
    p['drawing_pdf_url'] = f'/products/drawings/{slug}.pdf'
    p['drawing_note'] = note

products = json.loads(DATA.read_text(encoding='utf-8'))
assert set(CONTENT) == {p['slug'] for p in products}
for p in products:
    p['install_he'] = [{'title': title, 'items': items} for title, items in CONTENT[p['slug']]]
    first_page, last_page = p['catalog_pages']
    p['installation_source'] = f'קטלוג הספק, עמוד {first_page}' if first_page == last_page else f'קטלוג הספק, עמודים {first_page}-{last_page}'

missing = ['tub', 'adp', 'fil', 'special-parts', 'mounting-spring', 'mounting-clips']
paths = []
for p in products:
    if p['slug'] in missing:
        technical(p)
    else:
        p['drawing_kind'] = 'manufacturer'
    paths.append(installation(p))
DATA.write_text(json.dumps(products, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(INSTALL / 'source-manifest.json').write_text(json.dumps([
    {'slug': p['slug'], 'pdf': p['installation_pdf_url'], 'source_catalog_pages': p['catalog_pages'], 'drawing_kind': p['drawing_kind']}
    for p in products
], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

from PIL import Image, ImageDraw
for batch in range(math.ceil(len(paths) / 20)):
    sheet = Image.new('RGB', (1000, 1500), '#e8e6e1')
    draw = ImageDraw.Draw(sheet)
    for idx, path in enumerate(paths[batch * 20:(batch + 1) * 20]):
        pdf = fitz.open(path)
        pix = pdf[0].get_pixmap(matrix=fitz.Matrix(.45, .45))
        im = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        im.thumbnail((230, 270))
        x, y = (idx % 4) * 250, (idx // 4) * 300
        sheet.paste(im, (x + (250 - im.width) // 2, y + 22))
        draw.text((x + 10, y + 5), path.stem, fill='black')
    sheet.save(PREVIEWS / f'installation-{batch + 1}.jpg')
for slug in ('eilat', 'sd-sdd', 'tub', 'mounting-clips', 'sfd'):
    pdf = fitz.open(OUTPUT / 'installation' / f'{slug}.pdf')
    pdf[0].get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(PREVIEWS / f'{slug}.png')
print(f'Generated {len(paths)} Hebrew installation PDFs and {len(missing)} technical sheets.')
