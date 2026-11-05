# -*- coding: utf-8 -*-
"""Extract product seed data, product images and per-product PDFs from the Ram Air Flow catalog."""
import fitz, re, json, os, sys
from PIL import Image, ImageChops
from collections import defaultdict
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
PDF = os.path.join(ROOT, 'striplineAppx.pdf')
OFFSET = 3
doc = fitz.open(PDF)

FAMILIES = [
    ('GRILLES', 'grilles', 'תריסים', 'תריסי אספקה, יניקה וחוץ מאלומיניום, בגימור לבן או אנודייז, לכל סוגי החללים.'),
    ('DECORATIVE GRILLES', 'decorative-grilles', 'תריסים דקורטיביים', 'תריסים ליניאריים ודקורטיביים שנעלמים בקו התקרה והקיר.'),
    ('DIFFUSERS', 'diffusers', 'מפזרי אוויר', 'מפזרי תקרה עגולים, מרובעים ומחוררים לפיזור אוויר אחיד ושקט.'),
    ('SLOT DIFFUSERS', 'slot-diffusers', 'מפזרי סלוט', 'מפזרים ליניאריים דקים בקו נקי, אחד עד ארבעה חריצים.'),
    ('SWIRL DIFFUSERS', 'swirl-diffusers', 'מפזרי מערבולת', 'מפזרי מערבולת וג׳ט לתקרות גבוהות ולחללים גדולים.'),
    ('ACCESS DOORS', 'access-doors', 'דלתות שירות', 'דלתות ותריסי גישה לתחזוקה, משתלבים בקיר ובתקרה.'),
    ('JETS & VALVES', 'jets-valves', 'ג׳טים ושסתומים', 'מפזרי ג׳ט לטווח ארוך ושסתומים עגולים לאספקה ויניקה.'),
    ('FIRE DAMPERS', 'fire-dampers', 'מדפי אש', 'מדפי אש מלבניים ועגולים לתעלות מיזוג, בהתאם לתקן.'),
    ('CONTROL DAMPERS', 'control-dampers', 'ווסתים', 'ווסתי כמות אוויר, דמפרים ומדפי אל-חזור.'),
    ('FLEXIBLE DUCTS', 'flexible-ducts', 'תעלות גמישות', 'תעלות גמישות מבודדות ולא מבודדות לחיבור מפזרים.'),
    ('ACCESSORIES', 'accessories', 'אביזרים', 'מתאמים, מסננים, מסגרות התקנה וקליפסים.'),
]
FAM_SLUG = {f[0]: f[1] for f in FAMILIES}

# Hebrew name + one-line description per product code
HE = {
    'DD, DD1': ('תריס אספקה דו-כיווני', 'תריס אלומיניום עם להבים מתכווננים בשורה אחת (DD1) או בשתי שורות (DD) לכיוון זרימת האוויר.'),
    'EGG, EGGD': ('תריס מחורר', 'תריס אלומיניום מחורר (EGG) עם אפשרות לדמפר ויסות (EGGD), ליניקה ולאספקה.'),
    'EILAT': ('גריל אילת', 'גריל ליניארי עם שתי שורות להבים מתכוונים לאספקת אוויר / פליטת אוויר. עיצוב נקי, משתלב באופן מושלם בכל חלל.'),
    'NRD, NRDD': ('תריס גרביטציוני', 'תריס עם להבים נופלים הנפתחים בלחץ האוויר ונסגרים בהיעדרו.'),
    'LBDF': ('מפזר ליניארי לרצפה', 'מפזר ליניארי דריך להתקנה ברצפה או באדן חלון, מאלומיניום מחוזק.'),
    'SD, SDD': ('תריס יניקה', 'תריס יניקה עם להבים קבועים בזווית 45° (SD) ועם דמפר ויסות (SDD).'),
    'SD-DD': ('תריס משולב אספקה ויניקה', 'תריס משולב: חלק אספקה עם להבים מתכווננים וחלק יניקה בגוף אחד.'),
    'TG, TGS': ('תריס מעבר', 'תריס מעבר אוויר בין חללים עם להבי V למניעת קו ראייה.'),
    'WPL, WPLS': ('תריס חוץ', 'תריס חוץ נגד גשם עם להבים קבועים ורשת ציפורים.'),
    'WPLH': ('תריס חוץ עם להבים ניידים', 'תריס חוץ עם להבים מתכווננים לוויסות פתח יניקה או פליטה.'),
    'WPLSR, WPLR': ('תריס חוץ עגול', 'תריס חוץ עגול לחיבור ישיר לתעלה עגולה, עם רשת.'),
    'RDD, RDD-1': ('תריס לתעלה עגולה', 'תריס אספקה מעוגל להתקנה ישירה על תעלה עגולה, להבים מתכווננים.'),
    'RDR, RDR1': ('תריס מעוגל לתעלה עגולה', 'תריס מחורר מעוגל להתקנה על תעלות עגולות חשופות.'),
    'D-SS1, D-SS2': ('תריס דקורטיבי', 'תריס דקורטיבי עם להבים קבועים בפרופיל דק, לאספקה ויניקה.'),
    'LBD , LBDB, LBDD': ('תריס ליניארי דקורטיבי', 'תריס ליניארי דקורטיבי בקו רציף, עם אפשרות ללהבים אחוריים ודמפר.'),
    'RCD, RCD-R, RCDH, RCD-RH': ('מפזר תקרה עגול', 'מפזר תקרה עגול עם קונוסים מתכווננים, לתקרות נמוכות וגבוהות.'),
    'PGP': ('מפזר תקרה PGP / PGR', 'מפזר תקרה מחורר עם ליבה מעוצבת, מרובע (PGP) או עגול (PGR).'),
    'PFD, PF': ('מפזר תקרה מחורר', 'מפזר מחורר מרובע להתקנה בתקרה אקוסטית 600×600 או בגבס.'),
    'PFF, PFDD': ('מפזר מחורר עם מסגרת', 'מפזר מחורר עם מסגרת חיצונית, גם בגרסה עם דמפר.'),
    'PC': ('מפזר גלילי מחורר', 'מפזר גלילי מחורר תלוי, לחללים גבוהים וחנויות.'),
    'PA': ('מפזר אדריכלי', 'מפזר תקרה אדריכלי עם לוח מרכזי חלק, כמעט בלתי נראה.'),
    'LCD': ('מפזר תקרה ליניארי', 'מפזר ליניארי עם שכבות מדורגות לפיזור בשני כיוונים.'),
    'AC': ('מפזר דקורטיבי', 'מפזר דקורטיבי בעל להבים מדורגים, לאספקה בזווית.'),
    'CD - CK': ('מפזר תקרה מעוגל', 'מפזר תקרה עם דוגמת חורים מעוגלת, ליבה נשלפת.'),
    'SL': ('מפזר סלוט 4 כיוונים', 'מפזר תקרה מרובע עם ארבעה חריצים, 600×600.'),
    'FD': ('מפזר תקרה FD', 'מפזר תקרה עם להבים אלכסוניים קבועים לפיזור רחב.'),
    'CD': ('מפזר תקרה ארבעה כיוונים', 'מפזר תקרה מרובע קלאסי עם קונוסים, 1–4 כיוונים.'),
    'CD-S': ('מפזר תקרה CD-S', 'מפזר תקרה מרובע עם ליבה נשלפת ומסגרת דקה.'),
    'CD - DD': ('מפזר תקרה עם להבים מתכווננים', 'מפזר תקרה מרובע עם ליבת תריס דו-כיווני.'),
    'SLOT': ('מפזר סלוט ליניארי', 'מפזר סלוט ליניארי דק, 1–8 חריצים, בקו רציף ללא הפרעה.'),
    'BD1, BD2, BDV': ('מפזר ליניארי עם נחירים', 'מפזר ליניארי עם נחירים מתכווננים לכיוון זרימה מדויק.'),
    'SP2, SP3': ('מפזר ליניארי דיסקי', 'מפזר ליניארי עם דיסקיות מתכווננות, 2 או 3 שורות.'),
    'SWR': ('מפזר מערבולת', 'מפזר מערבולת תקרתי לפיזור מהיר ושקט של האוויר.'),
    'STD, STD-1': ('מפזר ג׳ט מערבולתי', 'מפזר מערבולת עם להבים מתכווננים לתקרות גבוהות.'),
    'SS': ('מפזר ג׳ט SS', 'מפזר מערבולת עגול עם להבים מתכווננים ידנית.'),
    'VS': ('מפזר ג׳ט VS', 'מפזר מערבולת מרובע עם להבים מתכווננים לחורף ולקיץ.'),
    'VSR': ('מפזר ג׳ט עגול מתכוונן', 'מפזר מערבולת עגול מתכוונן לתקרות גבוהות מאוד.'),
    'AD': ('תריס שירות', 'תריס גישה נפתח על ציר לתחזוקת מערכות.'),
    'AG': ('דלת שירות', 'דלת שירות עם לוח גבס קדמי, נסתרת לחלוטין בקיר או בתקרה.'),
    'JR': ('תעלת נחירים', 'תעלה עגולה עם נחירים מתכווננים לפיזור ממוקד.'),
    'JD': ('מפזר ג׳ט', 'מפזר ג׳ט עגול מתכוונן לטווח זריקה ארוך.'),
    'JB': ('מפזר ג׳ט עם נחירים', 'מפזר ג׳ט עם ליבת נחירים, זווית ותכנון גמישים.'),
    'EV': ('שסתום יניקה עגול', 'שסתום עגול ליניקה עם דיסק מתכוונן.'),
    'SV': ('שסתום אספקה עגול', 'שסתום עגול לאספקת אוויר עם דיסק מתכוונן.'),
    'VN': ('שסתום עגול VN / VLB / VLA', 'שסתומים עגולים ממתכת לאספקה ויניקה בקטרים שונים.'),
    'SJD': ('מפזר ג׳ט מיוחד', 'מפזר ג׳ט ייעודי לחללים מיוחדים ולזריקה ארוכה.'),
    'SFD': ('מדף אש מלבני', 'מדף אש מלבני עם נתיך תרמי, לתעלות מלבניות.'),
    'RFD': ('מדף אש עגול', 'מדף אש עגול עם נתיך תרמי, לתעלות עגולות.'),
    'VCD': ('ווסת כמות אוויר', 'ווסת כמות אוויר עם להבים מקבילים או נגדיים, ידני או ממונע.'),
    'OBD': ('דמפר להבים נגדיים', 'דמפר ויסות עם להבים נגדיים להתקנה מאחורי תריסים ומפזרים.'),
    'RSD': ('דמפר אל-חזור עגול', 'דמפר אל-חזור עגול למניעת זרימה חוזרת.'),
    'RD': ('ווסת אוויר עגול', 'דמפר ויסות עגול ידני לתעלות עגולות.'),
    'IRIS': ('ווסת איריס', 'ווסת כמות אוויר מסוג איריס עם מדידת לחץ מובנית.'),
    'TUB': ('תעלות גמישות', 'תעלות גמישות מאלומיניום, מבודדות ולא מבודדות.'),
    'ADP': ('מתאם', 'מתאם מבודד / לא מבודד לחיבור תריסים ומפזרים לתעלה.'),
    'FIL': ('מסנן אוויר', 'מסנן אוויר להתקנה מאחורי תריסי יניקה.'),
    'CC': ('מסגרת התקנה', 'מסגרת התקנה מפח מגולוון עם קליפסים להתקנה נסתרת.'),
}
ACC_PAGE = {'ADP': 119, 'FIL': 120, 'CC': 121}
HEADINGS = ['Description', 'Application', 'Characteristics', 'Accessories', 'Materials and finishing',
            'Assembly Methods', 'Technical design', 'Order codes', 'Annotation', 'Mounting', 'Installation',
            'Dimensions', 'Options', 'Selection table', 'Special Parts']


def norm(t):
    return t.replace('ﬂ', 'fl').replace('ﬁ', 'fi')


def slugify(code):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', code.lower())).strip('-')


# --- table of contents
items = []
nums = []
fam = None
for pn in (3, 4):
    for line in doc[pn].get_text().splitlines():
        s = line.strip()
        if not s:
            continue
        if re.fullmatch(r'\d+', s):
            nums.append(int(s))
            continue
        if '/' in s and '...' in s:
            code, name = re.split(r'\s*/\s*', s, 1)
            name = norm(re.sub(r'[\s.,]+$', '', name).strip())
            items.append((fam, code.strip(), name))
        elif s.isupper() and len(s) > 3 and '...' not in s:
            fam = s
nums = [n for n in nums if n not in (1, 2)]
toc = list(zip(items, nums))
for i, ((f, c, n), p) in enumerate(toc):
    if c in ACC_PAGE:
        toc[i] = ((f, c, n), ACC_PAGE[c] - OFFSET)


def page_lines(page):
    d = page.get_text('dict')
    spans = []
    for b in d['blocks']:
        if b['type']:
            continue
        for l in b['lines']:
            if abs(l['dir'][0]) < 0.9:  # skip the rotated side-bar labels
                continue
            for s in l['spans']:
                if 8.5 <= s['size'] <= 11 and s['text'].strip() and 25 < s['bbox'][0] < 560 and s['bbox'][1] > 140:
                    spans.append(s)
    lines = defaultdict(list)
    for s in spans:
        lines[round(s['bbox'][1] / 3)].append(s)
    out = []
    for k in sorted(lines):
        ss = sorted(lines[k], key=lambda s: s['bbox'][0])
        # split spans sharing a baseline into separate columns when there is a gap
        run = [ss[0]]
        for a, b in zip(ss, ss[1:]):
            if b['bbox'][0] - a['bbox'][2] > 12:
                out.append((run[0]['bbox'][0], run[0]['bbox'][1], norm(''.join(x['text'] for x in run))))
                run = []
            run.append(b)
        out.append((run[0]['bbox'][0], run[0]['bbox'][1], norm(''.join(x['text'] for x in run))))
    return out


def sections(page):
    lines = page_lines(page)
    cols = defaultdict(list)
    for x, y, t in lines:
        cols[round(x / 40)].append((y, t))
    res = {}
    for c in sorted(cols):
        cur = None
        for y, t in sorted(cols[c]):
            st = t.strip()
            h = next((h for h in HEADINGS if st.lower().startswith(h.lower()) and len(st) <= len(h) + 3), None)
            if h:
                cur = h
                res.setdefault(cur, [])
                continue
            if cur:
                res[cur].append(re.sub(r'\s+', ' ', st))

    def para(k):
        return re.sub(r'\s+', ' ', ' '.join(res.get(k, []))).strip()

    def lst(k):
        # the PDF wraps sentences over several lines: merge until a sentence ends
        out, buf = [], ''
        for x in res.get(k, []):
            x = x.strip()
            if not x:
                continue
            buf = (buf + ' ' + x).strip()
            if buf.endswith(('.', ')', ':')) or len(x) < 30:
                out.append(buf)
                buf = ''
        if buf:
            out.append(buf)
        return out

    return {'description_en': para('Description'), 'application_en': para('Application'),
            'characteristics_en': lst('Characteristics'), 'accessories_en': lst('Accessories'),
            'materials_en': lst('Materials and finishing'), 'assembly_en': lst('Assembly Methods')}


os.makedirs(os.path.join(SITE, 'public', 'products'), exist_ok=True)
os.makedirs(os.path.join(SITE, 'public', 'pdf', 'original'), exist_ok=True)
products = []
for i, ((f, code, name), cp) in enumerate(toc):
    start = cp + OFFSET - 1  # 0-based
    end = (toc[i + 1][1] + OFFSET - 2) if i + 1 < len(toc) else 121
    if end < start:
        end = start
    page = doc[start]
    slug = slugify(code)
    imgs = [im for im in page.get_image_info() if im['bbox'][1] < 470 and im['bbox'][3] > 120]
    imgs.sort(key=lambda im: -(im['bbox'][2] - im['bbox'][0]) * (im['bbox'][3] - im['bbox'][1]))
    r = fitz.Rect(imgs[0]['bbox']) if imgs else fitz.Rect(80, 120, 530, 470)
    r = fitz.Rect(max(50, r.x0 - 6), max(100, r.y0 - 6), min(560, r.x1 + 6), min(600, r.y1 + 6))
    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), clip=r)
    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    # trim near-white borders, keep a small margin
    bg = Image.new('RGB', img.size, (255, 255, 255))
    diff = ImageChops.difference(img, bg).convert('L').point(lambda v: 255 if v > 18 else 0)
    bbox = diff.getbbox()
    if bbox:
        m = 24
        img = img.crop((max(0, bbox[0] - m), max(0, bbox[1] - m), min(img.width, bbox[2] + m), min(img.height, bbox[3] + m)))
    img.save(os.path.join(SITE, 'public', 'products', f'{slug}.jpg'), quality=90)
    out = fitz.open()
    out.insert_pdf(doc, from_page=start, to_page=end)
    out.save(os.path.join(SITE, 'public', 'pdf', 'original', f'{slug}.pdf'), garbage=3, deflate=True)
    out.close()
    sec = sections(page)
    he = HE.get(code, (name, ''))
    codes = [c.strip() for c in re.split(r'[,/]', code) if c.strip()]
    clean_code = re.sub(r'\s*,\s*', ', ', code)
    products.append({
        'slug': slug, 'code': clean_code, 'codes': codes, 'name': name, 'name_he': he[0], 'subtitle_he': he[0],
        'family': FAM_SLUG[f], 'short_he': he[1], 'description_he': he[1],
        **sec,
        'catalog_pages': [cp, cp + (end - start)],
        'image': f'/products/{slug}.jpg', 'hero_image': '', 'drawing_image': '',
        'features_he': [], 'sizes_he': [], 'accessories_he': [],
        'materials_he': ['אלומיניום אקסטרודר', 'גימור סטנדרטי: צביעה אלקטרוסטטית RAL 9016 לבן', 'צבעים אחרים לפי דרישה'],
        'usage_he': '', 'lengths': [], 'heights': [], 'install_he': [], 'dwg_url': '',
        'pdf_url': f'/pdf/original/{slug}.pdf', 'featured': False,
    })
    print(f'{cp:>4} {start + 1:>4}-{end + 1:<4} {code:28} {name:45} img={"yes" if imgs else "NO "}')

fams = [{'slug': s, 'name': n, 'name_he': h, 'description_he': d, 'order': i} for i, (n, s, h, d) in enumerate(FAMILIES)]
os.makedirs(os.path.join(SITE, 'src', 'data'), exist_ok=True)
json.dump(fams, open(os.path.join(SITE, 'src', 'data', 'families.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(products, open(os.path.join(SITE, 'src', 'data', 'products.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(products), 'products written')
