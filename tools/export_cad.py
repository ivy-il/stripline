"""Export each product's vector technical drawing (from the catalogue PDF) to DXF and DWG.

The geometry is copied 1:1 from the supplier drawing; nothing is redrawn or re-dimensioned.
Catalogue drawings are illustrations, not scaled CAD, so every file carries a note saying so.
The client can replace any file from WordPress (product field "קובץ DWG").

Usage: python tools/export_cad.py
Requires: pip install ezdxf pymupdf ; LibreDWG in tools/bin/libredwg (dxf2dwg.exe).
"""
import json
import re
import subprocess
from pathlib import Path

import ezdxf
import fitz
from ezdxf.enums import TextEntityAlignment

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'site/public'
OUT = PUBLIC / 'products/cad'
TMP = ROOT / 'tmp/cad'  # intermediate DXF files (not published)
DXF2DWG = ROOT / 'tools/bin/libredwg/dxf2dwg.exe'
DATA_FILES = [ROOT / 'site/src/data/products.json', ROOT / 'wordpress-plugin/stripline-headless/seed/products.json']
CATALOGUE_HEADINGS = {'Technical design', 'Assembly Methods', 'Assembly Method', 'Order codes', 'Annotation'}
# Accessories whose "drawing" is a full catalogue page (photo + text), not a technical drawing.
NO_DRAWING = {'tub', 'adp', 'fil', 'special-parts', 'mounting-spring', 'mounting-clips'}
NOTE = 'STRIPLINE - drawing taken from the product catalogue. Not to scale: use the dimension labels (mm).'


def is_white(color):
    return bool(color) and min(color[:3]) > 0.94


def rgb(color):
    if not color:
        return None
    return tuple(round(c * 255) for c in color[:3])


def styled(entity, color, width=None):
    c = rgb(color)
    if c and c != (0, 0, 0):
        entity.rgb = c
    if width:
        entity.dxf.lineweight = max(0, min(211, round(width * 0.3528 * 100 / 5) * 5))
    return entity


def export(slug: str, pdf_path: Path, dxf_path: Path) -> dict:
    page = fitz.open(pdf_path)[0]
    area = page.rect
    height = area.height
    pt = lambda p: (p.x - area.x0, height - (p.y - area.y0))  # PDF is y-down, CAD is y-up

    doc = ezdxf.new('R2000', setup=True)
    doc.header['$INSUNITS'] = 0  # unitless: the catalogue drawing has no real-world scale
    for name, color in (('GEOMETRY', 7), ('FILL', 8), ('TEXT', 7), ('NOTE', 1)):
        doc.layers.add(name, color=color)
    msp = doc.modelspace()
    stats = {'paths': 0, 'text': 0}

    for path in page.get_drawings():
        r = path['rect']
        # Straight horizontal/vertical lines have a zero-area rect, which never "intersects"; pad it.
        if not fitz.Rect(r.x0 - 0.5, r.y0 - 0.5, r.x1 + 0.5, r.y1 + 0.5).intersects(area):
            continue
        # White shapes are page masks/background in the catalogue, not geometry; so are shapes far larger than the crop.
        if is_white(path.get('fill') if 'f' in path['type'] and 's' not in path['type'] else path.get('color')):
            continue
        if r.width > area.width * 1.2 or r.height > area.height * 1.2:
            continue
        filled = path.get('fill') is not None and 'f' in path['type']
        stroked = 's' in path['type']
        subpaths, current = [], []
        for item in path['items']:
            kind = item[0]
            if kind == 'l':
                a, b = pt(item[1]), pt(item[2])
                if current and current[-1] == a:
                    current.append(b)
                else:
                    if current:
                        subpaths.append(current)
                    current = [a, b]
            elif kind == 'c':
                # Flatten cubic Bezier into short segments (keeps arcs/fillets faithful).
                p0, p1, p2, p3 = (pt(p) for p in item[1:5])
                seg = [
                    (
                        (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t ** 2 * p2[0] + t ** 3 * p3[0],
                        (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t ** 2 * p2[1] + t ** 3 * p3[1],
                    )
                    for t in (i / 12 for i in range(13))
                ]
                if current and current[-1] == seg[0]:
                    current.extend(seg[1:])
                else:
                    if current:
                        subpaths.append(current)
                    current = seg
            elif kind == 're':
                if current:
                    subpaths.append(current)
                    current = []
                r = item[1]
                subpaths.append([pt(r.tl), pt(r.tr), pt(r.br), pt(r.bl), pt(r.tl)])
            elif kind == 'qu':
                if current:
                    subpaths.append(current)
                    current = []
                q = item[1]
                subpaths.append([pt(q.ul), pt(q.ur), pt(q.lr), pt(q.ll), pt(q.ul)])
        if current:
            subpaths.append(current)

        for pts in subpaths:
            if len(pts) < 2:
                continue
            closed = path.get('closePath') or pts[0] == pts[-1]
            if filled:
                hatch = msp.add_hatch(dxfattribs={'layer': 'FILL'})
                hatch.paths.add_polyline_path(pts, is_closed=True)
                styled(hatch, path.get('fill'))
            if stroked or not filled:
                line = msp.add_lwpolyline(pts, close=bool(closed), dxfattribs={'layer': 'GEOMETRY'})
                styled(line, path.get('color'), path.get('width'))
            stats['paths'] += 1

    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            vertical = abs(line['dir'][0]) < 0.5
            rotation = (90 if line['dir'][1] < 0 else 270) if vertical else 0
            for span in line['spans']:
                chars = [c for c in span['chars'] if c['c'].strip()]
                text = ''.join(c['c'] for c in span['chars']).strip()
                if not chars:
                    continue
                box = fitz.Rect(span['bbox'])
                # Skip catalogue headings and sidebar fragments cut by the crop edge.
                inside = fitz.Rect(area.x0 - 1, area.y0 - 1, area.x1 + 1, area.y1 + 1).contains(box)
                sidebar = box.x0 < area.x0 + 3 or (box.x1 < area.x0 + 14 and not any(ch.isdigit() for ch in text))
                if not inside or sidebar or text in CATALOGUE_HEADINGS:
                    continue
                color = fitz.sRGB_to_pdf(span['color'])
                # Vertical labels are stored glyph-by-glyph in scrambled order; place each glyph where it sits.
                runs = [(c['c'], c['origin']) for c in chars] if vertical else [(text, span['origin'])]
                for value, origin in runs:
                    ent = msp.add_text(value, height=span['size'] * 0.72, dxfattribs={'layer': 'TEXT', 'rotation': rotation})
                    ent.set_placement(pt(fitz.Point(origin)), align=TextEntityAlignment.LEFT)
                    styled(ent, color)
                stats['text'] += 1

    msp.add_text(NOTE, height=4, dxfattribs={'layer': 'NOTE'}).set_placement((0, -12))
    doc.saveas(dxf_path)
    return stats


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    products = json.loads(DATA_FILES[0].read_text(encoding='utf-8'))
    urls = {}
    for p in products:
        src = p.get('drawing_pdf_url')
        if p['slug'] in NO_DRAWING:
            urls[p['slug']] = ''
            continue
        if not src:
            print(f'skip {p["slug"]}: no drawing')
            continue
        dxf_path = TMP / f'{p["slug"]}.dxf'
        dwg_path = OUT / f'{p["slug"]}.dwg'
        stats = export(p['slug'], PUBLIC / src.lstrip('/'), dxf_path)
        dwg_path.unlink(missing_ok=True)
        res = subprocess.run([str(DXF2DWG), '-y', '--as', 'r2000', '-o', str(dwg_path), str(dxf_path)], capture_output=True, text=True)
        ok = dwg_path.exists() and dwg_path.stat().st_size > 0
        if not ok:  # fall back to publishing the DXF, which AutoCAD also opens
            (OUT / dxf_path.name).write_bytes(dxf_path.read_bytes())
        urls[p['slug']] = f'/products/cad/{p["slug"]}.{"dwg" if ok else "dxf"}'
        print(f'{p["slug"]:28} {stats["paths"]:4} paths {stats["text"]:3} labels  {"DWG" if ok else "DXF only: " + res.stderr[-120:]}')

    # Patch only the dwg_url values so the rest of each JSON file keeps its exact formatting.
    for data_path in DATA_FILES:
        if not data_path.exists():
            continue
        raw = data_path.read_text(encoding='utf-8')
        for slug, url in urls.items():
            raw = re.sub(r'("slug": "%s",.*?"dwg_url": )"[^"]*"' % re.escape(slug), lambda m: m.group(1) + json.dumps(url), raw, count=1, flags=re.S)
        data_path.write_bytes(raw.encode('utf-8'))
    print(f'{sum(1 for u in urls.values() if u)} CAD files, {sum(1 for u in urls.values() if not u)} accessories without a drawing, dwg_url written to {len(DATA_FILES)} data files')


if __name__ == '__main__':
    main()
